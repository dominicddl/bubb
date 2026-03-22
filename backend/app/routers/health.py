from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user

router = APIRouter()


@router.get("/health")
async def health_check():
    """Public endpoint — no auth required."""
    return {"status": "ok"}


@router.get("/health/auth")
async def auth_health_check(user: dict = Depends(get_current_user)):
    """Auth-gated endpoint — proves JWT validation works."""
    return {
        "status": "ok",
        "user_id": user.get("sub"),
        "email": user.get("email"),
    }
