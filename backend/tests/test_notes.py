import pytest

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
