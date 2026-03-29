import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler as _default_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.rate_limit import limiter, rate_limit_exceeded_handler
from app.routers import explain, health, notes, topics

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
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(explain.router, prefix="/api", tags=["explain"])
app.include_router(notes.router, prefix="/api", tags=["notes"])
app.include_router(topics.router, prefix="/api", tags=["topics"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch unhandled exceptions and return a clean 500 response."""
    print(f"[bubb] Unhandled exception: {exc}", file=sys.stderr)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )


@app.middleware("http")
async def catch_all_exceptions_middleware(request: Request, call_next):
    """Outermost middleware: catch any exception that escapes BaseHTTPMiddleware layers."""
    try:
        return await call_next(request)
    except Exception as exc:
        print(f"[bubb] Unhandled exception: {exc}", file=sys.stderr)
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal error occurred. Please try again later."},
        )
