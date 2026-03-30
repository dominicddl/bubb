import jwt
import structlog
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.config import settings

logger = structlog.get_logger()

security = HTTPBearer(auto_error=False)

# JWKS client fetches and caches the public key from Supabase for ES256 verification.
# The cache avoids hitting the JWKS endpoint on every request.
_jwks_client = PyJWKClient(
    f"{settings.supabase_url}/auth/v1/.well-known/jwks.json",
    cache_keys=True,
    lifespan=3600,
)


def _decode_token(token: str) -> dict:
    """Decode a Supabase JWT, supporting both ES256 (JWKS) and HS256 (legacy) signing."""
    # Try ES256 via JWKS first (newer Supabase CLI versions)
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            audience="authenticated",
            algorithms=["ES256"],
        )
    except (jwt.PyJWKClientError, jwt.PyJWTError):
        pass

    # Fall back to HS256 shared secret (legacy / older Supabase versions)
    return jwt.decode(
        token,
        settings.supabase_jwt_secret,
        audience="authenticated",
        algorithms=["HS256"],
    )


async def get_optional_user(
    cred: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict | None:
    """Like get_current_user but returns None instead of 401 for unauthenticated requests.
    Used for preview mode endpoints (D-16) where auth is optional."""
    if cred is None:
        return None
    try:
        return _decode_token(cred.credentials)
    except jwt.PyJWTError:
        return None


async def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Extract and validate Supabase JWT. Returns decoded token payload."""
    if cred is None:
        logger.warning("auth_failure", reason="missing")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    try:
        return _decode_token(cred.credentials)
    except jwt.ExpiredSignatureError:
        logger.warning("auth_failure", reason="expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.PyJWTError:
        logger.warning("auth_failure", reason="invalid")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )


async def get_user_token(
    cred: HTTPAuthorizationCredentials | None = Depends(security),
) -> str:
    """Extract the raw JWT string from the Authorization header.
    Use alongside get_current_user — this does NOT validate the token."""
    if cred is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    return cred.credentials
