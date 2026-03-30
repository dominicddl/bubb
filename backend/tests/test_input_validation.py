"""Tests for Pydantic Field constraints on request models."""

import pytest
from unittest.mock import AsyncMock, patch


@pytest.fixture(autouse=True)
def mock_providers_for_validation():
    """Mock AI providers so validation boundary tests don't make real API calls."""
    providers = {
        "anthropic": AsyncMock(return_value="Mocked."),
        "openai": AsyncMock(return_value="Mocked."),
    }
    with patch.dict("app.routers.explain.PROVIDERS", providers):
        yield


# --- ExplainRequest ---

@pytest.mark.asyncio
async def test_explain_text_too_long_returns_422(client):
    response = await client.post("/api/explain", json={
        "text": "a" * 5001,
        "context": "some context",
        "source_url": "https://example.com",
        "page_title": "Test",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_explain_context_too_long_returns_422(client):
    response = await client.post("/api/explain", json={
        "text": "hello",
        "context": "a" * 2001,
        "source_url": "https://example.com",
        "page_title": "Test",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_explain_source_url_too_long_returns_422(client):
    response = await client.post("/api/explain", json={
        "text": "hello",
        "context": "ctx",
        "source_url": "https://example.com/" + "a" * 2000,
        "page_title": "Test",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_explain_page_title_too_long_returns_422(client):
    response = await client.post("/api/explain", json={
        "text": "hello",
        "context": "ctx",
        "source_url": "https://example.com",
        "page_title": "a" * 501,
    })
    assert response.status_code == 422


# --- StreamExplainRequest ---

@pytest.mark.asyncio
async def test_stream_text_too_long_returns_422(client):
    response = await client.post("/api/explain/stream", json={
        "text": "a" * 5001,
        "context": "ctx",
        "source_url": "https://example.com",
        "page_title": "Test",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_stream_context_too_long_returns_422(client):
    response = await client.post("/api/explain/stream", json={
        "text": "hello",
        "context": "a" * 2001,
        "source_url": "https://example.com",
        "page_title": "Test",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_stream_source_url_too_long_returns_422(client):
    response = await client.post("/api/explain/stream", json={
        "text": "hello",
        "context": "ctx",
        "source_url": "https://example.com/" + "a" * 2000,
        "page_title": "Test",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_stream_page_title_too_long_returns_422(client):
    response = await client.post("/api/explain/stream", json={
        "text": "hello",
        "context": "ctx",
        "source_url": "https://example.com",
        "page_title": "a" * 501,
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_stream_follow_up_too_long_returns_422(client):
    response = await client.post("/api/explain/stream", json={
        "text": "hello",
        "context": "ctx",
        "source_url": "https://example.com",
        "page_title": "Test",
        "follow_up_question": "a" * 1001,
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_stream_conversation_history_too_many_turns_returns_422(client):
    turns = [{"question": "q", "answer": "a"} for _ in range(21)]
    response = await client.post("/api/explain/stream", json={
        "text": "hello",
        "context": "ctx",
        "source_url": "https://example.com",
        "page_title": "Test",
        "conversation_history": turns,
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_stream_conversation_turn_question_too_long_returns_422(client):
    response = await client.post("/api/explain/stream", json={
        "text": "hello",
        "context": "ctx",
        "source_url": "https://example.com",
        "page_title": "Test",
        "conversation_history": [{"question": "a" * 1001, "answer": "ok"}],
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_stream_conversation_turn_answer_too_long_returns_422(client):
    response = await client.post("/api/explain/stream", json={
        "text": "hello",
        "context": "ctx",
        "source_url": "https://example.com",
        "page_title": "Test",
        "conversation_history": [{"question": "hi", "answer": "a" * 5001}],
    })
    assert response.status_code == 422


# --- CreateTopicRequest ---

@pytest.mark.asyncio
async def test_create_topic_name_too_long_returns_422(client, valid_token):
    response = await client.post(
        "/api/topics",
        json={"name": "a" * 101},
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 422


# --- TopicSuggestionRequest ---

@pytest.mark.asyncio
async def test_suggest_topic_highlighted_text_too_long_returns_422(client, valid_token):
    response = await client.post(
        "/api/topics/suggest",
        json={
            "highlighted_text": "a" * 5001,
            "explanation": "short",
            "existing_topics": [],
        },
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_suggest_topic_explanation_too_long_returns_422(client, valid_token):
    response = await client.post(
        "/api/topics/suggest",
        json={
            "highlighted_text": "hello",
            "explanation": "a" * 5001,
            "existing_topics": [],
        },
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_suggest_topic_too_many_existing_topics_returns_422(client, valid_token):
    response = await client.post(
        "/api/topics/suggest",
        json={
            "highlighted_text": "hello",
            "explanation": "world",
            "existing_topics": [f"topic-{i}" for i in range(31)],
        },
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 422


# --- AssignTopicRequest ---

@pytest.mark.asyncio
async def test_assign_topic_id_too_long_returns_422(client, valid_token):
    response = await client.patch(
        "/api/notes/some-note-id/topic",
        json={"topic_id": "a" * 37},
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 422


# --- Boundary: valid at max length ---

@pytest.mark.asyncio
async def test_explain_text_at_max_length_accepted(client):
    response = await client.post("/api/explain", json={
        "text": "a" * 5000,
        "context": "some context",
        "source_url": "https://example.com",
        "page_title": "Test",
    })
    assert response.status_code != 422
