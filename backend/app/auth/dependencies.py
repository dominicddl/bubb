import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.config import settings

security = HTTPBearer(auto_error=False)


async def get_optional_user(
    cred: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict | None:
    """Like get_current_user but returns None instead of 401 for unauthenticated requests.
    Used for preview mode endpoints (D-16) where auth is optional."""
    if cred is None:
        return None
    try:
        payload = jwt.decode(
            cred.credentials,
            settings.supabase_jwt_secret,
            audience="authenticated",
            algorithms=["HS256"],
        )
        return payload
    except jwt.PyJWTError:
        return None


async def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Extract and validate Supabase JWT. Returns decoded token payload."""
    if cred is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    try:
        payload = jwt.decode(
            cred.credentials,
            settings.supabase_jwt_secret,
            audience="authenticated",
            algorithms=["HS256"],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
