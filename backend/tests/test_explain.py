from unittest.mock import AsyncMock, patch

import pytest


VALID_BODY = {
    "text": "machine learning",
    "context": "This article discusses machine learning techniques used in modern AI systems.",
    "source_url": "https://example.com/article",
    "page_title": "Introduction to AI",
}


async def _mock_provider(user_prompt: str) -> str:
    return "Mocked explanation."


@pytest.fixture(autouse=True)
def mock_all_providers():
    """Mock all AI providers so no real API calls are made."""
    mock_anthropic = AsyncMock(return_value="Mocked explanation.")
    mock_openai = AsyncMock(return_value="Mocked explanation.")

    providers = {
        "anthropic": mock_anthropic,
        "openai": mock_openai,
    }
    with patch.dict("app.routers.explain.PROVIDERS", providers):
        yield {"anthropic": mock_anthropic, "openai": mock_openai}


@pytest.mark.asyncio
async def test_explain_returns_200_with_explanation(client, mock_all_providers):
    """POST /api/explain with valid body returns 200 and non-empty explanation."""
    mock_all_providers["openai"].return_value = "This is a test explanation."
    response = await client.post("/api/explain", json=VALID_BODY)

    assert response.status_code == 200
    data = response.json()
    assert data["explanation"] == "This is a test explanation."
    assert data["provider"] == "openai"


@pytest.mark.asyncio
async def test_explain_missing_required_field_returns_422(client):
    """POST /api/explain with missing required field returns 422."""
    response = await client.post("/api/explain", json={
        "context": "some context",
        "source_url": "https://example.com",
        "page_title": "Test Page",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_explain_without_bearer_token_returns_200(client):
    """POST /api/explain without Bearer token still returns 200 (preview mode)."""
    response = await client.post("/api/explain", json=VALID_BODY)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_explain_with_valid_bearer_token_returns_200(client, valid_token):
    """POST /api/explain with valid Bearer token returns 200."""
    response = await client.post(
        "/api/explain",
        json=VALID_BODY,
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_explain_request_model_validates_all_fields(client):
    """ExplainRequest validates all required fields."""
    response = await client.post("/api/explain", json={
        "text": "quantum computing",
        "context": "A discussion of quantum bits",
        "source_url": "https://example.com/quantum",
        "page_title": "Quantum Computing 101",
    })
    assert response.status_code == 200

    for missing_field in ["context", "source_url", "page_title"]:
        body = {
            "text": "quantum",
            "context": "ctx",
            "source_url": "https://example.com",
            "page_title": "Test",
        }
        del body[missing_field]
        response = await client.post("/api/explain", json=body)
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_explain_provider_selection(client, mock_all_providers):
    """Provider field routes to the correct AI provider."""
    for provider in ["anthropic", "openai"]:
        mock_all_providers[provider].return_value = f"Response from {provider}"
        response = await client.post("/api/explain", json={**VALID_BODY, "provider": provider})

        assert response.status_code == 200
        assert response.json()["explanation"] == f"Response from {provider}"
        assert response.json()["provider"] == provider
        mock_all_providers[provider].assert_called_once()
        mock_all_providers[provider].reset_mock()


@pytest.mark.asyncio
async def test_explain_default_provider_when_none_specified(client, mock_all_providers):
    """When no provider specified, uses server default (anthropic)."""
    response = await client.post("/api/explain", json=VALID_BODY)
    assert response.status_code == 200
    assert response.json()["provider"] == "openai"
    mock_all_providers["openai"].assert_called_once()


@pytest.mark.asyncio
async def test_explain_system_prompt_content():
    """System prompt enforces plain language, no markdown, under 150 words."""
    from app.routers.explain import SYSTEM_PROMPT
    prompt = SYSTEM_PROMPT.lower()
    assert "150 words" in prompt
    assert "markdown" in prompt
    assert "plain" in prompt or "conversational" in prompt
