"""Tests for global error handler and SSE error sanitization."""

import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_unhandled_exception_returns_500_without_stack_trace(client, valid_token):
    """Unhandled exceptions return clean 500 JSON, not stack traces."""
    mock_supabase = AsyncMock()
    mock_supabase.table.side_effect = RuntimeError("Database connection lost")

    with patch("app.routers.notes.get_supabase", return_value=mock_supabase):
        response = await client.get(
            "/api/notes",
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    assert response.status_code == 500
    data = response.json()
    assert data["detail"] == "An internal error occurred. Please try again later."
    assert "Database connection lost" not in str(data)


@pytest.mark.asyncio
async def test_sse_stream_error_does_not_leak_exception(client):
    """SSE stream errors send generic message, not raw exception text."""

    async def _failing_stream(user_prompt, system_prompt):
        raise RuntimeError("Anthropic API key revoked")
        yield  # make it a generator

    stream_providers = {
        "openai": _failing_stream,
        "anthropic": _failing_stream,
        "google": _failing_stream,
    }

    with patch.dict("app.routers.explain.STREAM_PROVIDERS", stream_providers):
        response = await client.post("/api/explain/stream", json={
            "text": "hello",
            "context": "ctx",
            "source_url": "https://example.com",
            "page_title": "Test",
        })

    body = response.text
    assert "AI provider temporarily unavailable" in body
    assert "Anthropic API key revoked" not in body
