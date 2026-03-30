import structlog
from fastapi import APIRouter, Depends, Request, HTTPException, status

from app.auth.dependencies import get_current_user, get_user_token
from app.auth.supabase import get_supabase
from app.rate_limit import limiter, CRUD_LIMIT, WRITE_LIMIT, AI_LIMIT_AUTH, _get_user_id
from app.config import settings
from app.models.topics import (
    CreateTopicRequest,
    TopicResponse,
    TopicSuggestionRequest,
    TopicSuggestionResponse,
)

logger = structlog.get_logger()

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


@router.get("/topics", response_model=list[TopicResponse])
@limiter.limit(CRUD_LIMIT, key_func=_get_user_id)
async def list_topics(
    request: Request,
    user: dict = Depends(get_current_user),
    token: str = Depends(get_user_token),
) -> list[TopicResponse]:
    """List all topics for the authenticated user ordered by updated_at desc."""
    supabase = get_supabase(token)
    result = (
        supabase.table("topics")
        .select("*")
        .eq("user_id", user["sub"])
        .order("updated_at", desc=True)
        .execute()
    )
    return [TopicResponse(**topic) for topic in result.data]


@router.post("/topics", response_model=TopicResponse)
@limiter.limit(WRITE_LIMIT, key_func=_get_user_id)
async def create_topic(
    request: Request,
    body: CreateTopicRequest,
    user: dict = Depends(get_current_user),
    token: str = Depends(get_user_token),
) -> TopicResponse:
    """Create a new topic for the authenticated user, reusing existing if name matches."""
    supabase = get_supabase(token)
    user_id = user["sub"]

    # Check for existing topic with same name (case-insensitive)
    existing = (
        supabase.table("topics")
        .select("*")
        .eq("user_id", user_id)
        .ilike("name", body.name)
        .limit(1)
        .execute()
    )
    if existing.data:
        return TopicResponse(**existing.data[0])

    result = (
        supabase.table("topics")
        .insert({"name": body.name, "user_id": user_id})
        .execute()
    )
    return TopicResponse(**result.data[0])


@router.delete("/topics/{topic_id}", status_code=status.HTTP_200_OK)
async def delete_topic(
    topic_id: str,
    user: dict = Depends(get_current_user),
    token: str = Depends(get_user_token),
) -> dict:
    """Delete a topic owned by the authenticated user.

    Notes in this topic are kept but their topic_id is set to NULL.
    """
    supabase = get_supabase(token)
    user_id = user["sub"]

    # Verify ownership
    existing = (
        supabase.table("topics")
        .select("id")
        .eq("id", topic_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found"
        )

    # Orphan notes that belong to this topic
    supabase.table("notes").update({"topic_id": None}).eq(
        "topic_id", topic_id
    ).eq("user_id", user_id).execute()

    # Delete the topic
    supabase.table("topics").delete().eq("id", topic_id).eq(
        "user_id", user_id
    ).execute()

    return {"status": "ok"}


@router.post("/topics/suggest", response_model=TopicSuggestionResponse)
@limiter.limit(AI_LIMIT_AUTH, key_func=_get_user_id)
async def suggest_topic(
    request: Request,
    body: TopicSuggestionRequest,
    user: dict = Depends(get_current_user),
    token: str = Depends(get_user_token),
) -> TopicSuggestionResponse:
    """AI-powered topic suggestion that reuses existing topics when possible."""
    from openai import AsyncOpenAI

    supabase = get_supabase(token)

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
    logger.info("ai_provider_call", provider=provider, action="topic_suggestion")

    try:
        if provider == "openai":
            client = AsyncOpenAI(api_key=settings.openai_api_key)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.3,
                max_tokens=30,
                messages=[{"role": "user", "content": prompt}],
            )
            suggestion = (response.choices[0].message.content or "").strip()
        else:
            from anthropic import AsyncAnthropic

            client = AsyncAnthropic(api_key=settings.anthropic_api_key)
            response = await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=30,
                messages=[{"role": "user", "content": prompt}],
            )
            suggestion = (response.content[0].text if response.content else "").strip()
    except Exception as exc:
        logger.error("ai_provider_error", provider=provider, error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI provider temporarily unavailable. Please try again.",
        )

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
