from collections.abc import AsyncIterable

from fastapi import APIRouter, Depends, Request
from fastapi.sse import EventSourceResponse, ServerSentEvent
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
from google import genai

from app.auth.dependencies import get_optional_user
from app.rate_limit import limiter, _get_user_id_or_ip, _ai_limit_value
from app.config import settings
from app.models.explain import (
    ExplainRequest,
    ExplainResponse,
    Provider,
    StreamExplainRequest,
)

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


_NO_MARKDOWN = (
    "IMPORTANT: Write in plain text only. Do NOT use any markdown formatting whatsoever — "
    "no headers (#), no bold (**), no italics (*), no bullet points, no numbered lists, no code blocks. "
    "Just plain sentences and paragraphs."
)

DEPTH_SYSTEM_PROMPTS: dict[str, str] = {
    "simple": (
        "You are a helpful explainer for beginners. Explain the highlighted text as if talking "
        "to a curious 10-year-old. Use simple words, analogies, and no jargon. "
        f"Keep your explanation under 50 words. {_NO_MARKDOWN}"
    ),
    "standard": (
        "You are a helpful explainer. Explain the highlighted text at an undergraduate textbook "
        "level. Use clear language, define key terms briefly. Keep your explanation under 150 words. "
        f"{_NO_MARKDOWN}"
    ),
    "deep": (
        "You are an expert explaining to a domain expert. Use technical terminology, reference "
        "relevant concepts and frameworks, assume prior knowledge. Keep your explanation under "
        f"250 words. {_NO_MARKDOWN}"
    ),
}


async def _stream_openai(user_prompt: str, system_prompt: str) -> AsyncIterable[str]:
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    stream = await client.chat.completions.create(
        model=MODELS["openai"],
        temperature=0.3,
        max_tokens=400,
        stream=True,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    async for chunk in stream:
        token = chunk.choices[0].delta.content
        if token is not None:
            yield token


async def _stream_anthropic(user_prompt: str, system_prompt: str) -> AsyncIterable[str]:
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    async with client.messages.stream(
        model=MODELS["anthropic"],
        max_tokens=400,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        async for token in stream.text_stream:
            yield token


async def _stream_google(user_prompt: str, system_prompt: str) -> AsyncIterable[str]:
    client = genai.Client(api_key=settings.gemini_api_key)
    response = await client.aio.models.generate_content(
        model=MODELS["google"],
        contents=f"{system_prompt}\n\n{user_prompt}",
    )
    yield response.text or ""


STREAM_PROVIDERS: dict[str, object] = {
    "openai": _stream_openai,
    "anthropic": _stream_anthropic,
    "google": _stream_google,
}


def _build_stream_user_prompt(body: StreamExplainRequest) -> str:
    return (
        f"Page: {body.page_title}\n\n"
        f"Surrounding context:\n{body.context}\n\n"
        f"Highlighted text:\n{body.text}\n\n"
        "Explain what the highlighted text means in this context."
    )


@router.post("/explain/stream", response_class=EventSourceResponse)
@limiter.limit(_ai_limit_value, key_func=_get_user_id_or_ip)
async def stream_explain(
    request: Request,
    body: StreamExplainRequest,
    user: dict | None = Depends(get_optional_user),
) -> AsyncIterable[ServerSentEvent]:
    """Stream AI explanation as SSE tokens for depth-level prompts and follow-up conversations."""
    provider: Provider = body.provider or settings.default_ai_provider  # type: ignore[assignment]
    system_prompt = DEPTH_SYSTEM_PROMPTS[body.depth]
    user_prompt = _build_stream_user_prompt(body)

    if body.follow_up_question:
        if body.conversation_history:
            history_text = "\n".join(
                f"Q: {turn.question}\nA: {turn.answer}"
                for turn in body.conversation_history
            )
            user_prompt = (
                f"Context — the user highlighted this text on a webpage:\n{body.text}\n\n"
                f"Prior conversation:\n{history_text}\n\n"
                f"The user now asks: {body.follow_up_question}\n\n"
                "Answer the follow-up question directly. Do not repeat your previous explanation."
            )
        else:
            user_prompt = (
                f"Context — the user highlighted this text on a webpage:\n{body.text}\n\n"
                f"The user asks: {body.follow_up_question}\n\n"
                "Answer the question directly."
            )

    stream_fn = STREAM_PROVIDERS[provider]
    try:
        async for token in stream_fn(user_prompt, system_prompt):  # type: ignore[call-arg]
            yield ServerSentEvent(raw_data=token)
    except Exception as exc:
        # Surface provider errors to the client so the UI can display them
        yield ServerSentEvent(raw_data=f"[ERROR] {exc}")


@router.post("/explain", response_model=ExplainResponse)
@limiter.limit(_ai_limit_value, key_func=_get_user_id_or_ip)
async def explain_text(
    request: Request,
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
