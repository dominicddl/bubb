from fastapi import APIRouter, Depends, HTTPException, status
from supabase import create_client

from app.auth.dependencies import get_current_user
from app.config import settings
from app.models.notes import AssignTopicRequest, CreateNoteRequest, CreateNoteResponse, NoteCountResponse, NoteResponse

router = APIRouter()


def get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def escape_ilike(s: str) -> str:
    """Escape wildcard characters for use in ILIKE queries."""
    return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.post("/notes", response_model=CreateNoteResponse)
async def create_note(
    body: CreateNoteRequest,
    user: dict = Depends(get_current_user),
) -> CreateNoteResponse:
    """Create a note with duplicate detection. If same highlighted_text + source_url
    exists for this user, returns the existing note instead of inserting."""
    supabase = get_supabase()
    user_id = user["sub"]

    # Check for duplicate
    existing = (
        supabase.table("notes")
        .select("id, topic_id")
        .eq("user_id", user_id)
        .eq("highlighted_text", body.highlighted_text)
        .eq("source_url", body.source_url)
        .limit(1)
        .execute()
    )

    if existing.data:
        row = existing.data[0]
        return CreateNoteResponse(
            id=row["id"],
            is_duplicate=True,
            has_topic=row.get("topic_id") is not None,
        )

    # Insert new note
    result = (
        supabase.table("notes")
        .insert({
            "user_id": user_id,
            "highlighted_text": body.highlighted_text,
            "explanation": body.explanation,
            "source_url": body.source_url,
            "page_title": body.page_title,
            "responses": body.responses,
        })
        .select("id")
        .single()
        .execute()
    )

    return CreateNoteResponse(
        id=result.data["id"],
        is_duplicate=False,
        has_topic=False,
    )


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
