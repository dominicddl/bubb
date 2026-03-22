---
phase: 02-core-interaction
plan: 01
subsystem: api
tags: [fastapi, openai, gpt-4o-mini, pydantic, typescript, message-protocol, optional-auth]

# Dependency graph
requires:
  - phase: 01-foundation-and-auth
    provides: auth dependencies (get_current_user pattern, HTTPBearer security, JWT validation, FastAPI router pattern)
provides:
  - POST /api/explain endpoint calling GPT-4o-mini with optional auth (preview mode)
  - ExplainRequest and ExplainResponse Pydantic models
  - get_optional_user dependency for unauthenticated-friendly endpoints
  - ExplainTextMessage and ExplanationResponse TypeScript interfaces
  - EXPLAIN_TEXT message type in extension protocol
affects:
  - 02-03-content-script-popup (uses ExplainTextMessage to trigger explanation requests)
  - 02-02-background-handler (will route EXPLAIN_TEXT to /api/explain)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optional auth dependency pattern: get_optional_user returns None for unauthenticated requests instead of raising 401"
    - "TDD for FastAPI endpoints: write tests first against mock AsyncOpenAI, then implement"

key-files:
  created:
    - backend/app/models/explain.py
    - backend/app/routers/explain.py
    - backend/tests/test_explain.py
  modified:
    - backend/app/auth/dependencies.py
    - backend/app/main.py
    - extension/lib/messaging.ts

key-decisions:
  - "get_optional_user returns None (not 401) for unauthenticated requests — enables preview mode per D-16"
  - "System prompt constrains GPT-4o-mini to plain conversational language, under 150 words, no markdown per D-08/D-19/D-20"
  - "gpt-4o-mini at temperature=0.3 max_tokens=300 for consistent, concise explanations"

patterns-established:
  - "Optional auth pattern: HTTPBearer(auto_error=False) + dependency returning None on missing/invalid token"
  - "Mock AsyncOpenAI in tests by patching app.routers.explain.client"

requirements-completed: [CORE-02, CORE-05]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 02 Plan 01: Explain Endpoint and Message Protocol Summary

**FastAPI /api/explain endpoint proxying GPT-4o-mini with optional JWT auth, plain-text system prompt, and typed EXPLAIN_TEXT message protocol in the extension**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T08:55:03Z
- **Completed:** 2026-03-22T08:57:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created POST /api/explain endpoint accepting highlighted text, context, source URL, and page title — returns AI explanation from GPT-4o-mini
- Added `get_optional_user` dependency enabling preview mode: unauthenticated requests succeed (no 401)
- System prompt enforces plain conversational language, max 150 words, no markdown or bullet points
- Extended extension message protocol with `EXPLAIN_TEXT` message type and `ExplanationResponse` interface
- 6 backend tests covering validation, optional auth, and system prompt parameters all pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FastAPI explain endpoint with optional auth and Pydantic models** - `c575741` (feat)
2. **Task 2: Extend message protocol with EXPLAIN_TEXT types** - `f97fd88` (feat)

**Plan metadata:** (to be added after final commit)

## Files Created/Modified
- `backend/app/models/explain.py` - ExplainRequest and ExplainResponse Pydantic models
- `backend/app/routers/explain.py` - POST /api/explain endpoint with GPT-4o-mini proxy
- `backend/app/auth/dependencies.py` - Added get_optional_user for preview mode
- `backend/app/main.py` - Registered explain router under /api prefix
- `backend/tests/test_explain.py` - 6 tests covering all endpoint behaviors
- `extension/lib/messaging.ts` - Added EXPLAIN_TEXT, ExplainTextMessage, ExplanationResponse

## Decisions Made
- `get_optional_user` returns `None` instead of `401` for unauthenticated requests, implementing preview mode (D-16)
- System prompt explicitly states "under 150 words" and "Do not use bullet points or markdown formatting" to match design decisions D-08, D-19, D-20
- GPT-4o-mini at temperature=0.3 (low creativity, consistent explanations) with max_tokens=300

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx tsc --noEmit` reports pre-existing JSX errors in `BubbLogo.tsx` (missing `jsx` compiler option in WXT tsconfig). This is a pre-existing issue unrelated to messaging.ts changes. `messaging.ts` itself has zero TypeScript errors.

## Next Phase Readiness
- /api/explain endpoint is ready — Plan 02 (background handler) can route EXPLAIN_TEXT messages to it
- ExplainTextMessage type is defined — Plan 03 (content script popup) can use it to send highlight requests
- Optional auth pattern established and tested — future endpoints can reuse get_optional_user

---
## Self-Check: PASSED

- FOUND: backend/app/models/explain.py
- FOUND: backend/app/routers/explain.py
- FOUND: backend/tests/test_explain.py
- FOUND: 02-01-SUMMARY.md
- FOUND: commit c575741 (Task 1)
- FOUND: commit f97fd88 (Task 2)

---
*Phase: 02-core-interaction*
*Completed: 2026-03-22*
