from fastapi import APIRouter, Depends
from supabase import create_client

from app.auth.dependencies import get_current_user
from app.config import settings
from app.models.topics import (
    CreateTopicRequest,
    TopicResponse,
    TopicSuggestionRequest,
    TopicSuggestionResponse,
)

router = APIRouter()

TOPIC_SUGGESTION_PROMPT = (
    "Given the following highlighted text and its explanation, suggest a short "
    "noun-phrase topic label (2-4 words) that categorizes this knowledge. "
    "If one of the user's existing topics is a good match, return that exact name. "
    "Otherwise, suggest a new concise topic.\n\n"
    "Existing topics: {existing_topics}\n\n"
    "Highlighted text: {highlighted_text}\n"
    "Explanation: {explanation}\n\n"
    "Respond with ONLY the topic name, nothing else."
)


def get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.get("/topics", response_model=list[TopicResponse])
async def list_topics(
    user: dict = Depends(get_current_user),
) -> list[TopicResponse]:
    """List all topics for the authenticated user ordered by updated_at desc."""
    supabase = get_supabase()
    result = (
        supabase.table("topics")
        .select("*")
        .eq("user_id", user["sub"])
        .order("updated_at", desc=True)
        .execute()
    )
    return [TopicResponse(**topic) for topic in result.data]


@router.post("/topics", response_model=TopicResponse)
async def create_topic(
    body: CreateTopicRequest,
    user: dict = Depends(get_current_user),
) -> TopicResponse:
    """Create a new topic for the authenticated user."""
    supabase = get_supabase()
    result = (
        supabase.table("topics")
        .insert({"name": body.name, "user_id": user["sub"]})
        .execute()
    )
    return TopicResponse(**result.data[0])


@router.post("/topics/suggest", response_model=TopicSuggestionResponse)
async def suggest_topic(
    body: TopicSuggestionRequest,
    user: dict = Depends(get_current_user),
) -> TopicSuggestionResponse:
    """AI-powered topic suggestion that reuses existing topics when possible."""
    from openai import AsyncOpenAI

    supabase = get_supabase()

    # Limit to 30 existing topics to avoid prompt bloat (Pitfall 6)
    limited_topics = body.existing_topics[:30]
    existing_topics_str = ", ".join(limited_topics) if limited_topics else "None"

    prompt = TOPIC_SUGGESTION_PROMPT.format(
        existing_topics=existing_topics_str,
        highlighted_text=body.highlighted_text,
        explanation=body.explanation,
    )

    # Default to openai gpt-4o-mini; short non-streaming call
    provider = body.provider or "openai"

    if provider == "openai":
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.3,
            max_tokens=30,
            messages=[{"role": "user", "content": prompt}],
        )
        suggestion = (response.choices[0].message.content or "").strip()
    elif provider == "anthropic":
        from anthropic import AsyncAnthropic

        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=30,
            messages=[{"role": "user", "content": prompt}],
        )
        suggestion = (response.content[0].text if response.content else "").strip()
    else:
        # google provider
        from google import genai

        client = genai.Client(api_key=settings.gemini_api_key)
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        suggestion = (response.text or "").strip()

    # Case-insensitive match against ALL user's topics in the DB
    match_result = (
        supabase.table("topics")
        .select("id, name")
        .eq("user_id", user["sub"])
        .ilike("name", suggestion)
        .execute()
    )

    if match_result.data:
        matched = match_result.data[0]
        return TopicSuggestionResponse(
            suggested_topic=matched["name"],
            is_existing=True,
            existing_topic_id=matched["id"],
        )

    return TopicSuggestionResponse(
        suggested_topic=suggestion,
        is_existing=False,
        existing_topic_id=None,
    )
