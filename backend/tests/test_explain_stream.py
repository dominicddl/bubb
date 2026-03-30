"""Tests for SSE streaming endpoint /api/explain/stream."""
from collections.abc import AsyncIterable
from unittest.mock import patch

import pytest


VALID_STREAM_BODY = {
    "text": "machine learning",
    "context": "This article discusses machine learning techniques used in modern AI systems.",
    "source_url": "https://example.com/article",
    "page_title": "Introduction to AI",
    "depth": "simple",
}


async def _mock_stream_provider(user_prompt: str, system_prompt: str) -> AsyncIterable[str]:
    """A mock streaming provider that yields two tokens."""
    for token in ["hello", " world"]:
        yield token


@pytest.fixture(autouse=True)
def mock_all_stream_providers():
    """Mock all streaming AI providers so no real API calls are made."""

    async def mock_openai_stream(user_prompt: str, system_prompt: str) -> AsyncIterable[str]:
        for token in ["mocked", " response"]:
            yield token

    async def mock_anthropic_stream(user_prompt: str, system_prompt: str) -> AsyncIterable[str]:
        for token in ["mocked", " response"]:
            yield token

    providers = {
        "openai": mock_openai_stream,
        "anthropic": mock_anthropic_stream,
    }
    with patch.dict("app.routers.explain.STREAM_PROVIDERS", providers):
        yield providers


@pytest.mark.asyncio
async def test_stream_returns_sse(client):
    """POST /api/explain/stream returns 200 with Content-Type text/event-stream."""
    response = await client.post("/api/explain/stream", json=VALID_STREAM_BODY)

    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_stream_depth_prompts_distinct():
    """DEPTH_SYSTEM_PROMPTS contains distinct word limits for each depth level."""
    from app.routers.explain import DEPTH_SYSTEM_PROMPTS

    assert "50 words" in DEPTH_SYSTEM_PROMPTS["simple"]
    assert "150 words" in DEPTH_SYSTEM_PROMPTS["standard"]
    assert "250 words" in DEPTH_SYSTEM_PROMPTS["deep"]


@pytest.mark.asyncio
async def test_follow_up_includes_history(client):
    """Follow-up requests include 'Prior conversation' in constructed prompt."""
    captured_prompt: list[str] = []

    async def capturing_stream(user_prompt: str, system_prompt: str) -> AsyncIterable[str]:
        captured_prompt.append(user_prompt)
        yield "response"

    with patch.dict("app.routers.explain.STREAM_PROVIDERS", {"openai": capturing_stream}):
        body = {
            **VALID_STREAM_BODY,
            "conversation_history": [{"question": "q", "answer": "a"}],
            "follow_up_question": "why?",
        }
        response = await client.post("/api/explain/stream", json=body)

    assert response.status_code == 200
    assert len(captured_prompt) == 1
    assert "Prior conversation" in captured_prompt[0]


@pytest.mark.asyncio
async def test_stream_invalid_depth(client):
    """POST /api/explain/stream with depth='invalid' returns 422 validation error."""
    body = {**VALID_STREAM_BODY, "depth": "invalid"}
    response = await client.post("/api/explain/stream", json=body)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_stream_events_contain_data(client):
    """SSE response body contains data: lines for each yielded token."""
    async def mock_two_tokens(user_prompt: str, system_prompt: str) -> AsyncIterable[str]:
        yield "hello"
        yield " world"

    with patch.dict("app.routers.explain.STREAM_PROVIDERS", {"openai": mock_two_tokens}):
        response = await client.post("/api/explain/stream", json=VALID_STREAM_BODY)

    assert response.status_code == 200
    body_text = response.text
    assert "data: hello" in body_text
    assert "data:  world" in body_text
