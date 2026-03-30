import time
import uuid

import jwt
import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.logging import setup_logging
from app.rate_limit import limiter, rate_limit_exceeded_handler
from app.routers import explain, health, notes, topics

# Configure structured logging
setup_logging()
logger = structlog.get_logger()

app = FastAPI(title="bubb API", version="0.1.0")

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(explain.router, prefix="/api", tags=["explain"])
app.include_router(notes.router, prefix="/api", tags=["notes"])
app.include_router(topics.router, prefix="/api", tags=["topics"])


def _extract_user_id(request: Request) -> str:
    """Extract user_id from JWT if present, else return 'anonymous'."""
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
            return payload.get("sub", "anonymous")
        except jwt.PyJWTError:
            pass
    return "anonymous"


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch exceptions from dependency injection/route functions.

    The middleware below catches exceptions from call_next(). This handler
    covers the remaining path where FastAPI raises before reaching middleware.
    """
    logger.error(
        "unhandled_exception",
        exception_type=type(exc).__name__,
        exception_message=str(exc),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log every request with timing, user context, and request ID."""
    request_id = str(uuid.uuid4())
    user_id = _extract_user_id(request)

    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        user_id=user_id,
        method=request.method,
        path=request.url.path,
    )

    start = time.perf_counter()
    try:
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000)
        logger.info(
            "request_completed",
            status=response.status_code,
            duration_ms=duration_ms,
        )
        return response
    except Exception as exc:
        duration_ms = round((time.perf_counter() - start) * 1000)
        logger.error(
            "unhandled_exception",
            exception_type=type(exc).__name__,
            exception_message=str(exc),
            duration_ms=duration_ms,
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal error occurred. Please try again later."},
        )
    finally:
        structlog.contextvars.clear_contextvars()
