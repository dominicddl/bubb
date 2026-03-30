"""Tiered rate limiting for the bubb API."""

import jwt
import structlog
from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded

from app.config import settings

logger = structlog.get_logger()


def _is_authenticated(request: Request) -> bool:
    """Return True if the request carries a valid Bearer JWT."""
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        try:
            jwt.decode(
                token,
                settings.supabase_jwt_secret,
                audience="authenticated",
                algorithms=["HS256"],
            )
            return True
        except jwt.PyJWTError:
            pass
    return False


def _get_user_id_or_ip(request: Request) -> str:
    """Extract user_id from JWT if present, otherwise fall back to client IP."""
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                audience="authenticated",
                algorithms=["HS256"],
            )
            return f"user:{payload['sub']}"
        except jwt.PyJWTError:
            pass
    return f"ip:{request.client.host if request.client else '0.0.0.0'}"


def _get_user_id(request: Request) -> str:
    """Extract user_id from JWT. Falls back to IP if token missing."""
    return _get_user_id_or_ip(request)


def _get_ip(request: Request) -> str:
    """Rate limit by client IP only (unauthenticated requests)."""
    return f"ip:{request.client.host if request.client else '0.0.0.0'}"


def _ai_limit_value(key: str) -> str:
    """Return the appropriate AI rate limit string based on the resolved key.

    slowapi calls this with the result of key_func(request) when the callable
    has a parameter named 'key'. The key is either 'user:<uuid>' (authenticated)
    or 'ip:<host>' (unauthenticated).

    Authenticated users get 10/minute (per user ID).
    Unauthenticated requests get 3/minute (per IP).
    Using a single dynamic limit avoids the dual-decorator problem where both
    buckets fire independently and the stricter one (3/min) always wins.
    """
    return AI_LIMIT_AUTH if key.startswith("user:") else AI_LIMIT_UNAUTH


limiter = Limiter(key_func=_get_user_id_or_ip, default_limits=[])


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Return a clean JSON 429 response with retry_after."""
    logger.warning(
        "rate_limit_exceeded",
        endpoint=request.url.path,
        detail=exc.detail,
    )
    return JSONResponse(
        status_code=429,
        content={
            "detail": f"Rate limit exceeded. {exc.detail}",
            "retry_after": int(getattr(exc, "retry_after", 60)),
        },
        headers={"Retry-After": str(getattr(exc, "retry_after", 60))},
    )


# Rate limit strings for each tier
AI_LIMIT_AUTH = "10/minute"
AI_LIMIT_UNAUTH = "3/minute"
CRUD_LIMIT = "60/minute"
WRITE_LIMIT = "30/minute"
