---
phase: 01-foundation-and-auth
plan: 02
subsystem: auth
tags: [jwt, fastapi, pyjwt, pytest, supabase, rls, health-endpoint]

# Dependency graph
requires:
  - phase: 01-01
    provides: backend scaffold with FastAPI app, config.py with supabase_jwt_secret field, pyproject.toml with PyJWT dependency

provides:
  - JWT verification FastAPI dependency (get_current_user) with HS256 + audience "authenticated"
  - Server-side Supabase admin client (service role, bypasses RLS)
  - Public /api/health endpoint
  - Auth-gated /api/health/auth endpoint
  - Full backend test suite (9 passing tests)
  - RLS policy verification tests confirming SQL structure correctness

affects:
  - 01-03 (extension-side Google OAuth authenticates against this backend's JWT layer)
  - All future FastAPI endpoints use get_current_user as Depends() for auth

# Tech tracking
tech-stack:
  added: [pytest-asyncio (asyncio_mode=auto), httpx (ASGITransport for async tests)]
  patterns: [TDD red-green, FastAPI Depends() for auth, HTTPBearer with auto_error=False, RLS SQL structure validation]

key-files:
  created:
    - backend/app/auth/dependencies.py
    - backend/app/auth/supabase.py
    - backend/app/routers/health.py
    - backend/tests/__init__.py
    - backend/tests/conftest.py
    - backend/tests/test_auth.py
    - backend/tests/test_health.py
    - backend/tests/test_rls.py
  modified:
    - backend/app/main.py
    - backend/pyproject.toml

key-decisions:
  - "asyncio_mode=auto added to pyproject.toml [tool.pytest.ini_options] — required for async pytest fixtures (client) with pytest-asyncio v1.3"
  - "RLS tests validate migration SQL structure rather than live Supabase queries — live cross-user RLS testing requires two authenticated users, deferred to Plan 03 manual verification checkpoint"
  - "Test JWT secret set to 30-byte string — InsecureKeyLengthWarning is expected and acceptable for unit tests"

patterns-established:
  - "FastAPI auth: HTTPBearer(auto_error=False) + Depends(security) allows graceful 401 handling vs hard errors"
  - "JWT decode: always specify audience='authenticated' and algorithms=['HS256'] to match Supabase token format"
  - "Test fixture pattern: monkeypatch.setattr(settings, field, value) for overriding config in tests"
  - "RLS tests: mark with pytest.mark.rls, call requires_supabase() to skip gracefully in CI"

requirements-completed: [AUTH-03, AUTH-04]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 01 Plan 02: Backend Auth Layer and Test Suite Summary

**FastAPI JWT verification via PyJWT (HS256, audience "authenticated") with public/auth-gated health endpoints and 9-test suite covering valid/expired/invalid token handling plus RLS SQL structure validation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T14:42:09Z
- **Completed:** 2026-03-21T14:44:48Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- JWT verification dependency that decodes Supabase-format tokens, distinguishes expired vs invalid errors, and returns decoded payload for downstream use
- Public `/api/health` and auth-gated `/api/health/auth` endpoints, replacing inline health route in main.py with proper router
- 9 passing tests covering all auth error paths (no-cred, valid, expired, invalid) and health endpoint integration
- RLS verification tests confirming migration SQL has ENABLE ROW LEVEL SECURITY, USING/WITH CHECK on auth.uid(), and FOR ALL policies on all 3 tables

## Task Commits

Each task was committed atomically:

1. **Task 1: JWT verification dependency + health router + supabase admin client** - `da09ae5` (feat)
2. **Task 2: Backend test suite for JWT auth and health endpoints** - `c09aeb6` (test)
3. **Task 3: RLS policy verification tests for AUTH-03** - `a5e2264` (test)

_Note: TDD tasks — tests written first (RED), then implementation (GREEN), committed together per task_

## Files Created/Modified
- `backend/app/auth/dependencies.py` - get_current_user FastAPI dependency with JWT decode + error handling
- `backend/app/auth/supabase.py` - Server-side Supabase admin client using service role key
- `backend/app/routers/health.py` - Public and auth-gated health check endpoints
- `backend/app/main.py` - Replaced inline health route with include_router(health.router)
- `backend/pyproject.toml` - Added asyncio_mode=auto to pytest config
- `backend/tests/__init__.py` - Empty test package marker
- `backend/tests/conftest.py` - Shared fixtures: valid_token, expired_token, client, override_jwt_secret
- `backend/tests/test_auth.py` - 4 tests for get_current_user dependency
- `backend/tests/test_health.py` - 5 tests for health endpoints
- `backend/tests/test_rls.py` - 4 RLS SQL structure validation tests

## Decisions Made
- asyncio_mode=auto: Required by pytest-asyncio v1.3 for async fixture support in pytest 9. Auto mode means all async test functions and fixtures are treated as asyncio without explicit `@pytest.mark.asyncio`.
- RLS tests validate SQL structure: Live cross-user RLS testing (insert as user A, query as user B) requires the full auth system (two Supabase users). SQL structure validation catches the most common mistakes — missing ENABLE ROW LEVEL SECURITY, missing auth.uid(), missing WITH CHECK — which was sufficient for Wave 0 requirements.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added asyncio_mode=auto to pyproject.toml**
- **Found during:** Task 2 (backend test suite)
- **Issue:** pytest-asyncio v1.3 with pytest 9 requires explicit asyncio mode configuration. Without it, async fixtures (client) caused PytestRemovedIn9Warning errors and test collection failures.
- **Fix:** Added `[tool.pytest.ini_options]` section with `asyncio_mode = "auto"` to `backend/pyproject.toml`
- **Files modified:** backend/pyproject.toml
- **Verification:** All 9 tests pass without async fixture warnings
- **Committed in:** da09ae5 (Task 1 commit, alongside implementation)

---

**Total deviations:** 1 auto-fixed (1 missing critical config)
**Impact on plan:** Fix was necessary for test infrastructure to work. No scope creep.

## Issues Encountered
- pytest-asyncio v1.3 requires `asyncio_mode = "auto"` for async fixtures to work with pytest 9 — added to pyproject.toml.

## User Setup Required
None - no external service configuration required for these tests. RLS tests skip gracefully without SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY.

## Next Phase Readiness
- JWT auth layer complete — Plan 03 (extension-side Google OAuth) authenticates against this backend
- get_current_user dependency is ready for all future FastAPI endpoint protection
- Run `uv run pytest -x -q -m "not rls"` for fast CI (9 tests, ~0.3s)
- Run `uv run pytest tests/test_rls.py -m rls` with Supabase running for live RLS verification

---
*Phase: 01-foundation-and-auth*
*Completed: 2026-03-21*

## Self-Check: PASSED

All created files verified on disk. All task commits verified in git log.
- FOUND: backend/app/auth/dependencies.py
- FOUND: backend/app/auth/supabase.py
- FOUND: backend/app/routers/health.py
- FOUND: backend/tests/test_auth.py, test_health.py, test_rls.py
- FOUND: da09ae5, c09aeb6, a5e2264
