from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from supabase import create_client

from app.auth.dependencies import get_current_user
from app.config import settings

router = APIRouter()


def get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.get("/health")
async def health_check():
    """Public endpoint — no auth required. Checks DB connectivity."""
    try:
        supabase = get_supabase()
        supabase.table("notes").select("id").limit(1).execute()
        return {"status": "ok", "database": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "database": "unreachable"},
        )


@router.get("/health/auth")
async def auth_health_check(user: dict = Depends(get_current_user)):
    """Auth-gated endpoint — proves JWT validation works."""
    return {
        "status": "ok",
        "user_id": user.get("sub"),
        "email": user.get("email"),
    }
