from fastapi import APIRouter, Depends
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
from google import genai

from app.auth.dependencies import get_optional_user
from app.config import settings
from app.models.explain import ExplainRequest, ExplainResponse, Provider

router = APIRouter()

SYSTEM_PROMPT = (
    "You are a helpful explainer. The user highlighted text on a webpage and wants to "
    "understand it. Explain the highlighted text in context of the surrounding content. "
    "Use plain, conversational language. Keep your explanation under 150 words "
    "(2-3 short paragraphs). Do not use bullet points or markdown formatting."
)

MODELS: dict[Provider, str] = {
    "anthropic": "claude-haiku-4-5-20251001",
    "openai": "gpt-4o-mini",
    "google": "gemini-2.0-flash",
}


def _build_user_prompt(body: ExplainRequest) -> str:
    return (
        f"Page: {body.page_title}\n\n"
        f"Surrounding context:\n{body.context}\n\n"
        f"Highlighted text:\n{body.text}\n\n"
        "Explain what the highlighted text means in this context."
    )


async def _call_anthropic(user_prompt: str) -> str:
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    response = await client.messages.create(
        model=MODELS["anthropic"],
        max_tokens=300,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return response.content[0].text if response.content else ""


async def _call_openai(user_prompt: str) -> str:
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model=MODELS["openai"],
        temperature=0.3,
        max_tokens=300,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    return response.choices[0].message.content or ""


async def _call_google(user_prompt: str) -> str:
    client = genai.Client(api_key=settings.gemini_api_key)
    response = await client.aio.models.generate_content(
        model=MODELS["google"],
        contents=f"{SYSTEM_PROMPT}\n\n{user_prompt}",
    )
    return response.text or ""


PROVIDERS = {
    "anthropic": _call_anthropic,
    "openai": _call_openai,
    "google": _call_google,
}


@router.post("/explain", response_model=ExplainResponse)
async def explain_text(
    body: ExplainRequest,
    user: dict | None = Depends(get_optional_user),
) -> ExplainResponse:
    """Proxy highlighted text to an AI provider and return a plain-text explanation.

    Auth is optional (preview mode per D-16): unauthenticated requests are allowed.
    Provider can be specified per-request or falls back to server default.
    """
    provider: Provider = body.provider or settings.default_ai_provider  # type: ignore[assignment]
    user_prompt = _build_user_prompt(body)
    call_fn = PROVIDERS[provider]
    explanation = await call_fn(user_prompt)
    return ExplainResponse(explanation=explanation, provider=provider)
