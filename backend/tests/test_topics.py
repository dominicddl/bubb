from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.mark.asyncio
async def test_suggest_topic_requires_auth(client):
    """POST /api/topics/suggest without auth returns 401."""
    response = await client.post(
        "/api/topics/suggest",
        json={
            "highlighted_text": "neural networks",
            "explanation": "A type of machine learning model.",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_topics_requires_auth(client):
    """GET /api/topics without auth returns 401."""
    response = await client.get("/api/topics")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_topic_requires_auth(client):
    """POST /api/topics without auth returns 401."""
    response = await client.post("/api/topics", json={"name": "Machine Learning"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_suggest_topic_mocked(client, valid_token):
    """POST /api/topics/suggest calls OpenAI with correct prompt and returns is_existing=False when no DB match."""
    mock_choice = MagicMock()
    mock_choice.message.content = "Neural Networks"
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_openai_create = AsyncMock(return_value=mock_completion)

    # Mock Supabase to return no matching topic
    mock_supabase = MagicMock()
    mock_ilike_result = MagicMock()
    mock_ilike_result.data = []
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .ilike.return_value
        .execute.return_value
    ) = mock_ilike_result

    with patch("app.routers.topics.get_supabase", return_value=mock_supabase), \
         patch("openai.AsyncOpenAI") as mock_openai_cls:
        mock_openai_instance = MagicMock()
        mock_openai_instance.chat.completions.create = mock_openai_create
        mock_openai_cls.return_value = mock_openai_instance

        response = await client.post(
            "/api/topics/suggest",
            json={
                "highlighted_text": "neural networks",
                "explanation": "A type of machine learning model.",
                "existing_topics": ["Python Basics", "Data Structures"],
            },
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["suggested_topic"] == "Neural Networks"
    assert data["is_existing"] is False
    assert data["existing_topic_id"] is None

    # Verify the prompt contained the existing topics
    call_kwargs = mock_openai_create.call_args
    messages = call_kwargs.kwargs["messages"]
    prompt_content = messages[0]["content"]
    assert "Python Basics" in prompt_content
    assert "Data Structures" in prompt_content


@pytest.mark.asyncio
async def test_suggest_topic_reuses_existing(client, valid_token):
    """POST /api/topics/suggest returns is_existing=True when DB match found."""
    mock_choice = MagicMock()
    mock_choice.message.content = "Quantum Physics"
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_openai_create = AsyncMock(return_value=mock_completion)

    # Mock Supabase to return a matching topic
    mock_supabase = MagicMock()
    mock_ilike_result = MagicMock()
    mock_ilike_result.data = [{"id": "abc123", "name": "Quantum Physics"}]
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .ilike.return_value
        .execute.return_value
    ) = mock_ilike_result

    with patch("app.routers.topics.get_supabase", return_value=mock_supabase), \
         patch("openai.AsyncOpenAI") as mock_openai_cls:
        mock_openai_instance = MagicMock()
        mock_openai_instance.chat.completions.create = mock_openai_create
        mock_openai_cls.return_value = mock_openai_instance

        response = await client.post(
            "/api/topics/suggest",
            json={
                "highlighted_text": "quantum entanglement",
                "explanation": "A phenomenon where particles are linked.",
                "existing_topics": ["Quantum Physics", "Thermodynamics"],
            },
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["suggested_topic"] == "Quantum Physics"
    assert data["is_existing"] is True
    assert data["existing_topic_id"] == "abc123"
