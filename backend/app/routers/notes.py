from fastapi import APIRouter, Depends, HTTPException, status
from supabase import create_client

from app.auth.dependencies import get_current_user
from app.config import settings
from app.models.notes import AssignTopicRequest, NoteCountResponse, NoteResponse

router = APIRouter()


def get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def escape_ilike(s: str) -> str:
    """Escape wildcard characters for use in ILIKE queries."""
    return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/notes", response_model=list[NoteResponse])
async def list_notes(
    source_url: str | None = None,
    topic_id: str | None = None,
    search: str | None = None,
    user: dict = Depends(get_current_user),
) -> list[NoteResponse]:
    """List notes for the authenticated user with optional filters."""
    supabase = get_supabase()
    query = supabase.table("notes").select(
        "id, highlighted_text, explanation, source_url, page_title, topic_id, created_at"
    ).eq("user_id", user["sub"])

    if source_url is not None:
        query = query.eq("source_url", source_url)

    if topic_id is not None:
        query = query.eq("topic_id", topic_id)

    if search is not None:
        escaped = escape_ilike(search)
        query = query.or_(
            f"highlighted_text.ilike.%{escaped}%,explanation.ilike.%{escaped}%"
        )

    result = query.order("created_at", desc=True).execute()
    return [NoteResponse(**note) for note in result.data]


@router.get("/notes/count", response_model=NoteCountResponse)
async def count_notes(
    user: dict = Depends(get_current_user),
) -> NoteCountResponse:
    """Return total note count for the authenticated user."""
    supabase = get_supabase()
    result = (
        supabase.table("notes")
        .select("id", count="exact")
        .eq("user_id", user["sub"])
        .execute()
    )
    return NoteCountResponse(count=result.count or 0)


@router.patch("/notes/{note_id}/topic", status_code=status.HTTP_200_OK)
async def assign_topic(
    note_id: str,
    body: AssignTopicRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    """Atomically assign a topic to a note and update note_count via RPC."""
    supabase = get_supabase()
    supabase.rpc(
        "assign_topic_to_note",
        {"p_note_id": note_id, "p_topic_id": body.topic_id},
    ).execute()
    return {"status": "ok"}
