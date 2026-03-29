"""Tests for tiered rate limiting."""

import pytest
from unittest.mock import AsyncMock, patch


@pytest.fixture(autouse=True)
def mock_providers_for_rate_limit():
    """Mock AI providers so rate limit tests don't make real API calls."""
    mock_openai = AsyncMock(return_value="Mocked explanation.")
    providers = {
        "anthropic": AsyncMock(return_value="Mocked."),
        "openai": mock_openai,
        "google": AsyncMock(return_value="Mocked."),
    }
    with patch.dict("app.routers.explain.PROVIDERS", providers):
        yield


# --- AI tier: 10/minute per user ---

@pytest.mark.asyncio
async def test_explain_rate_limited_after_10_requests(client):
    """POST /api/explain returns 429 after 10 requests in a minute (unauth uses IP key)."""
    body = {
        "text": "hello",
        "context": "ctx",
        "source_url": "https://example.com",
        "page_title": "Test",
    }
    # First 3 requests should succeed (unauth AI limit is 3/min)
    for i in range(3):
        response = await client.post("/api/explain", json=body)
        assert response.status_code == 200, f"Request {i+1} failed unexpectedly"

    # 4th request should be rate limited
    response = await client.post("/api/explain", json=body)
    assert response.status_code == 429


@pytest.mark.asyncio
async def test_explain_auth_rate_limited_after_10_requests(client, valid_token):
    """POST /api/explain with auth returns 429 after 10 requests."""
    body = {
        "text": "hello",
        "context": "ctx",
        "source_url": "https://example.com",
        "page_title": "Test",
    }
    headers = {"Authorization": f"Bearer {valid_token}"}

    for i in range(10):
        response = await client.post("/api/explain", json=body, headers=headers)
        assert response.status_code == 200, f"Request {i+1} failed unexpectedly"

    # 11th request should be rate limited
    response = await client.post("/api/explain", json=body, headers=headers)
    assert response.status_code == 429


@pytest.mark.asyncio
async def test_rate_limit_429_response_format(client):
    """429 response contains detail and retry_after fields."""
    body = {
        "text": "hello",
        "context": "ctx",
        "source_url": "https://example.com",
        "page_title": "Test",
    }
    # Exhaust unauth limit (3/min)
    for _ in range(3):
        await client.post("/api/explain", json=body)

    response = await client.post("/api/explain", json=body)
    assert response.status_code == 429
    data = response.json()
    assert "detail" in data
    assert "retry_after" in data


# --- CRUD tier: 60/minute per user ---

@pytest.mark.asyncio
async def test_health_endpoint_not_rate_limited(client):
    """GET /api/health is never rate limited."""
    from unittest.mock import MagicMock

    mock_supabase = MagicMock()
    mock_result = MagicMock()
    mock_result.data = [{"id": "test"}]
    mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = mock_result

    with patch("app.routers.health.get_supabase", return_value=mock_supabase):
        for _ in range(100):
            response = await client.get("/api/health")
            assert response.status_code == 200
