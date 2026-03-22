# bubb Backend

FastAPI server providing AI proxy endpoints and authenticated API routes.

## Setup

```bash
uv sync
cp .env.example .env   # Add SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
uv run uvicorn app.main:app --reload
```

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | No | Health check |
| GET | `/api/health/auth` | JWT | Authenticated health check |

## Architecture

```
app/
  main.py              # FastAPI app, CORS, router mounting
  config.py            # Settings via pydantic-settings
  auth/
    dependencies.py    # get_current_user JWT verification dependency
    supabase.py        # Supabase admin client (service role)
  routers/
    health.py          # Health check endpoints
```

## Auth

JWT verification via Supabase. The `get_current_user` dependency extracts and validates the Bearer token from the extension's Supabase session.

## Testing

```bash
uv run pytest                    # All tests
uv run pytest tests/test_auth.py # Auth tests only
```
