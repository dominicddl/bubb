from unittest.mock import AsyncMock, MagicMock, patch

import pytest


VALID_BODY = {
    "text": "machine learning",
    "context": "This article discusses machine learning techniques used in modern AI systems.",
    "source_url": "https://example.com/article",
    "page_title": "Introduction to AI",
}


@pytest.mark.asyncio
async def test_explain_returns_200_with_explanation(client):
    """Test 1: POST /api/explain with valid body returns 200 and non-empty explanation."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "This is a test explanation."

    with patch("app.routers.explain.client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        response = await client.post("/api/explain", json=VALID_BODY)

    assert response.status_code == 200
    data = response.json()
    assert "explanation" in data
    assert len(data["explanation"]) > 0
    assert data["explanation"] == "This is a test explanation."


@pytest.mark.asyncio
async def test_explain_missing_required_field_returns_422(client):
    """Test 2: POST /api/explain with missing required field returns 422."""
    body_without_text = {
        "context": "some context",
        "source_url": "https://example.com",
        "page_title": "Test Page",
    }
    response = await client.post("/api/explain", json=body_without_text)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_explain_without_bearer_token_returns_200(client):
    """Test 3: POST /api/explain without Bearer token still returns 200 (preview mode per D-16)."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Explanation for unauthenticated user."

    with patch("app.routers.explain.client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        response = await client.post("/api/explain", json=VALID_BODY)

    assert response.status_code == 200
    assert response.json()["explanation"] == "Explanation for unauthenticated user."


@pytest.mark.asyncio
async def test_explain_with_valid_bearer_token_returns_200(client, valid_token):
    """Test 4: POST /api/explain with valid Bearer token returns 200."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Explanation for authenticated user."

    with patch("app.routers.explain.client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        response = await client.post(
            "/api/explain",
            json=VALID_BODY,
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    assert response.status_code == 200
    assert response.json()["explanation"] == "Explanation for authenticated user."


@pytest.mark.asyncio
async def test_explain_request_model_validates_all_fields(client):
    """Test 5: ExplainRequest model validates text, context, source_url, page_title fields."""
    # All four required fields present — should succeed
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "OK"

    with patch("app.routers.explain.client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        response = await client.post(
            "/api/explain",
            json={
                "text": "quantum computing",
                "context": "A discussion of quantum bits",
                "source_url": "https://example.com/quantum",
                "page_title": "Quantum Computing 101",
            },
        )
    assert response.status_code == 200

    # Missing context — should fail
    response = await client.post(
        "/api/explain",
        json={
            "text": "quantum computing",
            "source_url": "https://example.com/quantum",
            "page_title": "Quantum Computing 101",
        },
    )
    assert response.status_code == 422

    # Missing source_url — should fail
    response = await client.post(
        "/api/explain",
        json={
            "text": "quantum computing",
            "context": "A discussion of quantum bits",
            "page_title": "Quantum Computing 101",
        },
    )
    assert response.status_code == 422

    # Missing page_title — should fail
    response = await client.post(
        "/api/explain",
        json={
            "text": "quantum computing",
            "context": "A discussion of quantum bits",
            "source_url": "https://example.com/quantum",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_explain_system_prompt_uses_plain_language(client):
    """Test 6: System prompt instructs GPT-4o-mini to use plain conversational language,
    no markdown, under 150 words."""
    captured_calls = []

    async def capture_create(**kwargs):
        captured_calls.append(kwargs)
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test explanation."
        return mock_response

    with patch("app.routers.explain.client") as mock_client:
        mock_client.chat.completions.create = capture_create
        await client.post("/api/explain", json=VALID_BODY)

    assert len(captured_calls) == 1
    call = captured_calls[0]

    # Check model and parameters
    assert call["model"] == "gpt-4o-mini"
    assert call["temperature"] == 0.3
    assert call["max_tokens"] == 300

    # Check system prompt content
    messages = call["messages"]
    system_messages = [m for m in messages if m["role"] == "system"]
    assert len(system_messages) == 1
    system_prompt = system_messages[0]["content"].lower()
    assert "150 words" in system_prompt
    assert "markdown" in system_prompt
    assert "plain" in system_prompt or "conversational" in system_prompt
