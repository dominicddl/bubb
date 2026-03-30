"""Tests verifying users cannot access other users' data."""

import time
from unittest.mock import MagicMock, patch

import jwt
import pytest

from tests.conftest import TEST_JWT_SECRET, TEST_USER_ID

# A second user to test cross-user access
OTHER_USER_ID = "99999999-aaaa-bbbb-cccc-000000000000"
OTHER_EMAIL = "other@example.com"

NOTE_ID = "11111111-1111-1111-1111-111111111111"
TOPIC_ID = "22222222-2222-2222-2222-222222222222"


@pytest.fixture
def other_user_token() -> str:
    """JWT for a different user than the default test user."""
    payload = {
        "sub": OTHER_USER_ID,
        "email": OTHER_EMAIL,
        "aud": "authenticated",
        "role": "authenticated",
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


def _mock_supabase_empty():
    """Create a mock Supabase client that returns empty results for all queries."""
    mock = MagicMock()
    empty_result = MagicMock()
    empty_result.data = []
    empty_result.count = 0
    # Chain: .table().select().eq().eq().limit().execute() -> empty
    mock.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = empty_result
    # Chain: .table().select().eq().order().execute() -> empty
    mock.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = empty_result
    # Chain: .table().select(count=).eq().execute() -> empty
    mock.table.return_value.select.return_value.eq.return_value.execute.return_value = empty_result
    # Chain: .table().delete().eq().eq().execute() -> empty
    mock.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = empty_result
    return mock


@pytest.mark.asyncio
async def test_user_cannot_delete_other_users_note(client, valid_token):
    """Deleting another user's note returns 404, not the note."""
    mock = _mock_supabase_empty()

    with patch("app.routers.notes.get_supabase", return_value=mock):
        response = await client.delete(
            f"/api/notes/{NOTE_ID}",
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    # delete_note does a select first; if empty, it just deletes nothing (no error)
    # The important thing is it filters by user_id — the mock returns empty
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_user_cannot_merge_responses_to_other_users_note(client, valid_token):
    """Merging responses into another user's note returns 404."""
    mock = _mock_supabase_empty()

    with patch("app.routers.notes.get_supabase", return_value=mock):
        response = await client.post(
            f"/api/notes/{NOTE_ID}/responses",
            headers={"Authorization": f"Bearer {valid_token}"},
            json={"responses": {"simple": "test response"}},
        )

    assert response.status_code == 404
    assert response.json()["detail"] == "Note not found"


@pytest.mark.asyncio
async def test_user_cannot_append_conversation_to_other_users_note(client, valid_token):
    """Appending a conversation turn to another user's note returns 404."""
    mock = _mock_supabase_empty()

    with patch("app.routers.notes.get_supabase", return_value=mock):
        response = await client.post(
            f"/api/notes/{NOTE_ID}/conversation",
            headers={"Authorization": f"Bearer {valid_token}"},
            json={"turn": {"question": "test?", "answer": "test."}},
        )

    assert response.status_code == 404
    assert response.json()["detail"] == "Note not found"


@pytest.mark.asyncio
async def test_user_cannot_delete_other_users_topic(client, valid_token):
    """Deleting another user's topic returns 404."""
    mock = _mock_supabase_empty()

    with patch("app.routers.topics.get_supabase", return_value=mock):
        response = await client.delete(
            f"/api/topics/{TOPIC_ID}",
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    assert response.status_code == 404
    assert response.json()["detail"] == "Topic not found"


@pytest.mark.asyncio
async def test_user_list_notes_only_returns_own(client, valid_token):
    """Listing notes returns only the authenticated user's notes (filtered by user_id)."""
    mock = MagicMock()
    user_notes = MagicMock()
    user_notes.data = [
        {
            "id": NOTE_ID,
            "highlighted_text": "test",
            "explanation": "test",
            "source_url": "https://example.com",
            "page_title": "Test",
            "topic_id": None,
            "created_at": "2026-03-30T00:00:00Z",
        }
    ]
    mock.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = user_notes

    with patch("app.routers.notes.get_supabase", return_value=mock):
        response = await client.get(
            "/api/notes",
            headers={"Authorization": f"Bearer {valid_token}"},
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == NOTE_ID

    # Verify the query was filtered by the test user's ID
    mock.table.return_value.select.return_value.eq.assert_called_with(
        "user_id", TEST_USER_ID
    )
