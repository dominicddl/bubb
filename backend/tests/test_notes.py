import pytest
from unittest.mock import MagicMock, patch

from app.routers.notes import escape_ilike


@pytest.mark.asyncio
async def test_list_notes_requires_auth(client):
    """GET /api/notes without auth returns 401."""
    response = await client.get("/api/notes")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_count_notes_requires_auth(client):
    """GET /api/notes/count without auth returns 401."""
    response = await client.get("/api/notes/count")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_assign_topic_requires_auth(client):
    """PATCH /api/notes/{id}/topic without auth returns 401."""
    response = await client.patch(
        "/api/notes/some-note-id/topic",
        json={"topic_id": "some-topic-id"},
    )
    assert response.status_code == 401


def test_escape_ilike():
    """escape_ilike escapes %, _, and \\ for safe ILIKE queries."""
    assert escape_ilike("50% off_sale") == "50\\% off\\_sale"
    assert escape_ilike("100%") == "100\\%"
    assert escape_ilike("a_b") == "a\\_b"
    assert escape_ilike("back\\slash") == "back\\\\slash"
    assert escape_ilike("normal text") == "normal text"


@pytest.mark.asyncio
async def test_create_note_requires_auth(client):
    """POST /api/notes without auth returns 401."""
    response = await client.post(
        "/api/notes",
        json={
            "highlighted_text": "test text",
            "explanation": "test explanation",
            "source_url": "https://example.com",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_note_new(client, valid_token):
    """POST /api/notes inserts new note and returns id."""
    mock_supabase = MagicMock()

    # No duplicate found
    mock_select_result = MagicMock()
    mock_select_result.data = []
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .limit.return_value
        .execute.return_value
    ) = mock_select_result

    # Insert returns new note
    mock_insert_result = MagicMock()
    mock_insert_result.data = {"id": "new-note-123"}
    (
        mock_supabase.table.return_value
        .insert.return_value
        .select.return_value
        .single.return_value
        .execute.return_value
    ) = mock_insert_result

    with patch("app.routers.notes.get_supabase", return_value=mock_supabase):
        response = await client.post(
            "/api/notes",
            json={
                "highlighted_text": "neural networks",
                "explanation": "A computational model.",
                "source_url": "https://example.com/ml",
                "page_title": "ML Guide",
                "responses": {"simple": "A computational model."},
            },
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "new-note-123"
    assert data["is_duplicate"] is False
    assert data["has_topic"] is False


@pytest.mark.asyncio
async def test_create_note_duplicate(client, valid_token):
    """POST /api/notes with duplicate returns existing note id."""
    mock_supabase = MagicMock()

    # Duplicate found
    mock_select_result = MagicMock()
    mock_select_result.data = [{"id": "existing-456", "topic_id": "topic-789"}]
    (
        mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .limit.return_value
        .execute.return_value
    ) = mock_select_result

    with patch("app.routers.notes.get_supabase", return_value=mock_supabase):
        response = await client.post(
            "/api/notes",
            json={
                "highlighted_text": "neural networks",
                "explanation": "A computational model.",
                "source_url": "https://example.com/ml",
            },
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "existing-456"
    assert data["is_duplicate"] is True
    assert data["has_topic"] is True


@pytest.mark.asyncio
async def test_delete_note_requires_auth(client):
    """DELETE /api/notes/{id} without auth returns 401."""
    response = await client.delete("/api/notes/some-id")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_note(client, valid_token):
    """DELETE /api/notes/{id} deletes the note."""
    mock_supabase = MagicMock()
    mock_delete_result = MagicMock()
    mock_delete_result.data = [{"id": "note-123"}]
    (
        mock_supabase.table.return_value
        .delete.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_delete_result

    with patch("app.routers.notes.get_supabase", return_value=mock_supabase):
        response = await client.delete(
            "/api/notes/note-123",
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_merge_responses_requires_auth(client):
    """POST /api/notes/{id}/responses without auth returns 401."""
    response = await client.post(
        "/api/notes/some-id/responses",
        json={"responses": {"standard": "more detail"}},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_merge_responses(client, valid_token):
    """POST /api/notes/{id}/responses calls merge_note_responses RPC."""
    mock_supabase = MagicMock()
    mock_rpc_result = MagicMock()
    mock_rpc_result.data = None
    (
        mock_supabase.rpc.return_value
        .execute.return_value
    ) = mock_rpc_result

    with patch("app.routers.notes.get_supabase", return_value=mock_supabase):
        response = await client.post(
            "/api/notes/note-123/responses",
            json={"responses": {"standard": "detailed explanation"}},
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    assert response.status_code == 200
    mock_supabase.rpc.assert_called_once_with(
        "merge_note_responses",
        {"note_id": "note-123", "new_responses": {"standard": "detailed explanation"}},
    )


@pytest.mark.asyncio
async def test_append_conversation_requires_auth(client):
    """POST /api/notes/{id}/conversation without auth returns 401."""
    response = await client.post(
        "/api/notes/some-id/conversation",
        json={"turn": {"question": "why?", "answer": "because"}},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_append_conversation(client, valid_token):
    """POST /api/notes/{id}/conversation calls append_conversation_turn RPC."""
    mock_supabase = MagicMock()
    mock_rpc_result = MagicMock()
    mock_rpc_result.data = None
    (
        mock_supabase.rpc.return_value
        .execute.return_value
    ) = mock_rpc_result

    with patch("app.routers.notes.get_supabase", return_value=mock_supabase):
        response = await client.post(
            "/api/notes/note-123/conversation",
            json={"turn": {"question": "What is X?", "answer": "X is Y."}},
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    assert response.status_code == 200
    mock_supabase.rpc.assert_called_once_with(
        "append_conversation_turn",
        {"note_id": "note-123", "turn": {"question": "What is X?", "answer": "X is Y."}},
    )
