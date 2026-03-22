from fastapi import APIRouter, Depends
from openai import AsyncOpenAI

from app.auth.dependencies import get_optional_user
from app.config import settings
from app.models.explain import ExplainRequest, ExplainResponse

router = APIRouter()

client = AsyncOpenAI(api_key=settings.openai_api_key)

SYSTEM_PROMPT = (
    "You are a helpful explainer. The user highlighted text on a webpage and wants to "
    "understand it. Explain the highlighted text in context of the surrounding content. "
    "Use plain, conversational language. Keep your explanation under 150 words "
    "(2-3 short paragraphs). Do not use bullet points or markdown formatting."
)


@router.post("/explain", response_model=ExplainResponse)
async def explain_text(
    body: ExplainRequest,
    user: dict | None = Depends(get_optional_user),
) -> ExplainResponse:
    """Proxy highlighted text to GPT-4o-mini and return a plain-text explanation.

    Auth is optional (preview mode per D-16): unauthenticated requests are allowed.
    """
    user_prompt = (
        f"Page: {body.page_title}\n\n"
        f"Surrounding context:\n{body.context}\n\n"
        f"Highlighted text:\n{body.text}\n\n"
        "Explain what the highlighted text means in this context."
    )

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.3,
        max_tokens=300,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )

    explanation = response.choices[0].message.content or ""
    return ExplainResponse(explanation=explanation)
