import time

import httpx
import jwt
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.auth.supabase import get_supabase_admin
from app.config import settings

router = APIRouter()


class GoogleTokenRequest(BaseModel):
    access_token: str


class AuthUserResponse(BaseModel):
    id: str
    email: str
    name: str


class GoogleAuthResponse(BaseModel):
    access_token: str
    user: AuthUserResponse


@router.post("/auth/google", response_model=GoogleAuthResponse)
async def exchange_google_token(body: GoogleTokenRequest):
    """Exchange a Google access token (from chrome.identity.getAuthToken)
    for a Supabase-compatible JWT session."""

    # 1. Verify token with Google and get user info
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {body.access_token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google access token",
        )

    google_user = resp.json()
    email = google_user.get("email")
    name = google_user.get("name", "")
    picture = google_user.get("picture", "")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account has no email",
        )

    # 2. Find or create user in Supabase
    supabase = get_supabase_admin()
    user_id = None

    # Search for existing user by email
    try:
        users_resp = supabase.auth.admin.list_users()
        for u in users_resp:
            if u.email == email:
                user_id = u.id
                break
    except Exception:
        pass

    if not user_id:
        # Create new user
        try:
            new_user = supabase.auth.admin.create_user(
                {
                    "email": email,
                    "email_confirm": True,
                    "user_metadata": {
                        "full_name": name,
                        "avatar_url": picture,
                    },
                }
            )
            user_id = new_user.user.id
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user: {e}",
            )

    # 3. Generate Supabase-compatible JWT
    now = int(time.time())
    payload = {
        "aud": "authenticated",
        "exp": now + 3600,
        "iat": now,
        "sub": str(user_id),
        "email": email,
        "role": "authenticated",
        "user_metadata": {"full_name": name, "avatar_url": picture},
    }
    supabase_jwt = jwt.encode(
        payload, settings.supabase_jwt_secret, algorithm="HS256"
    )

    return GoogleAuthResponse(
        access_token=supabase_jwt,
        user=AuthUserResponse(id=str(user_id), email=email, name=name),
    )
