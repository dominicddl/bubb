---
phase: 01-foundation-and-auth
plan: 03
subsystem: auth
tags: [google-oauth, chrome-identity, supabase, chrome-storage, service-worker, react, typescript, vitest]

# Dependency graph
requires:
  - phase: 01-foundation-and-auth/01-01
    provides: WXT project scaffold, shadcn components (Button, Card, Alert, Badge, Separator), entrypoint stubs
  - phase: 01-foundation-and-auth/01-02
    provides: FastAPI backend with /api/health/auth JWT-protected endpoint
provides:
  - Google OAuth sign-in via chrome.identity.launchWebAuthFlow (AUTH-01)
  - Session persistence in chrome.storage.local via custom Supabase adapter (AUTH-02)
  - Typed message protocol for background <-> UI communication
  - Side panel with signed-out state (welcome + Google sign-in) and signed-in state (greeting + sign-out)
  - Auth error banner with retry (dismissible)
  - Background service worker with synchronous listener registration
  - Authenticated extension-to-backend connection verify function (ROADMAP criterion #3)
  - Storage adapter unit tests (7 passing, Wave 0 VALIDATION.md)
affects: [02-core-explanation, future phases using Supabase auth, any phase needing auth state]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "chrome.identity.launchWebAuthFlow for Google OAuth ID token flow (D-01)"
    - "chromeStorageAdapter: in-memory cache + chrome.storage.local for Supabase session"
    - "Synchronous listener registration in background service worker (Pitfall 4 prevention)"
    - "Message routing: UI contexts send to background via chrome.runtime.sendMessage"
    - "Auth state broadcast: background sends AUTH_STATE_CHANGED to all contexts via onAuthStateChange"
    - "Non-blocking backend connection check after sign-in"

key-files:
  created:
    - extension/lib/storage.ts
    - extension/lib/supabase.ts
    - extension/lib/auth.ts
    - extension/lib/messaging.ts
    - extension/.env.example
    - extension/tests/lib/storage-adapter.test.ts
    - extension/entrypoints/sidepanel/components/SignedOutView.tsx
    - extension/entrypoints/sidepanel/components/SignedInView.tsx
    - extension/entrypoints/sidepanel/components/AuthErrorBanner.tsx
  modified:
    - extension/entrypoints/background.ts
    - extension/entrypoints/sidepanel/App.tsx
    - extension/entrypoints/popup/App.tsx

key-decisions:
  - "ID token flow (response_type=id_token) used instead of PKCE -- avoids FedCM edge cases in extensions per research D-01"
  - "Nonce hashing: SHA-256 hash sent to Google, raw nonce sent to Supabase for verification"
  - "chrome.storage.local adapter with in-memory cache for synchronous-style reads before async resolves"
  - "verifyBackendConnection is non-blocking -- sign-in succeeds even if backend unreachable (dev workflow)"
  - "All auth actions route through background service worker (only context with chrome.identity access)"

patterns-established:
  - "Pattern: lib/ layer (storage.ts, supabase.ts, auth.ts, messaging.ts) shared by all extension contexts"
  - "Pattern: Typed message contracts in messaging.ts prevent runtime message mismatches"
  - "Pattern: Background broadcasts auth state changes to all open UI contexts"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 01 Plan 03: Extension Google OAuth and Auth UI Summary

**Google OAuth via chrome.identity.launchWebAuthFlow with Supabase JWT session persistence, typed message protocol, and full auth UI (signed-out/signed-in states, error banner)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T14:47:53Z
- **Completed:** 2026-03-21T14:51:24Z
- **Tasks:** 3 of 4 complete (Task 4 is manual checkpoint)
- **Files modified:** 12

## Accomplishments

- Storage adapter with in-memory cache + chrome.storage.local, 7 unit tests passing (TDD)
- Full Google OAuth ID token flow in background service worker, session persisted via Supabase client
- Side panel renders signed-out state (UI-SPEC compliant) and signed-in state with sign-out confirmation
- Auth error banner with AlertCircle icon, dismiss X, and retry button per UI-SPEC
- Background registers all listeners synchronously (Pitfall 4 prevention), broadcasts auth state changes
- verifyBackendConnection proves full auth chain: Google OAuth -> Supabase JWT -> FastAPI /api/health/auth

## Task Commits

Each task was committed atomically:

1. **Task 1 (TDD RED): Storage adapter tests** - `1d24715` (test)
2. **Task 1 (TDD GREEN): Supabase client, auth, messaging, storage** - `2b8cdd4` (feat)
3. **Task 2 + 3: Background handler, side panel UI, popup UI, backend verify** - `6d48ed6` (feat)

## Files Created/Modified

- `extension/lib/storage.ts` - chromeStorageAdapter with in-memory cache + chrome.storage.local
- `extension/lib/supabase.ts` - Singleton Supabase client with custom storage adapter
- `extension/lib/auth.ts` - signInWithGoogle (ID token flow), signOut, getAuthState
- `extension/lib/messaging.ts` - Typed message contracts: SIGN_IN, SIGN_OUT, GET_AUTH_STATE, AUTH_STATE_CHANGED
- `extension/.env.example` - WXT_SUPABASE_URL, WXT_SUPABASE_ANON_KEY, WXT_BACKEND_URL
- `extension/tests/lib/storage-adapter.test.ts` - 7 unit tests for getItem/setItem/removeItem (all pass)
- `extension/entrypoints/background.ts` - Auth message handler, onAuthStateChange broadcast, verifyBackendConnection
- `extension/entrypoints/sidepanel/App.tsx` - Auth state management, signed-in/out rendering, error banner
- `extension/entrypoints/sidepanel/components/SignedOutView.tsx` - "Welcome to bubb", preview badge, sign-in button
- `extension/entrypoints/sidepanel/components/SignedInView.tsx` - "Hey, {firstName}", sign-out with confirmation
- `extension/entrypoints/sidepanel/components/AuthErrorBanner.tsx` - AlertCircle, dismiss X, retry button
- `extension/entrypoints/popup/App.tsx` - Compact auth prompt, opens side panel for sign-in

## Decisions Made

- ID token flow (`response_type=id_token`) chosen over PKCE to avoid FedCM edge cases in extensions
- Nonce hashing pattern: SHA-256 hash sent to Google, raw nonce to Supabase
- In-memory cache in chromeStorageAdapter enables synchronous-style reads before chrome.storage.local resolves
- Backend connection check non-blocking so sign-in works when backend is not running locally
- All chrome.identity calls remain in background service worker (only context where they're available)

## Deviations from Plan

None -- Tasks 2 and 3 were combined into a single commit (verifyBackendConnection was written directly into background.ts during Task 2 implementation since it was the same file). No unplanned work.

## Issues Encountered

None. Build passed on first attempt, all 7 storage adapter tests pass.

## User Setup Required

**Manual setup required before testing (Task 4 checkpoint):**

1. Create Google Cloud project with OAuth 2.0 credentials (Chrome Extension type)
2. Get the redirect URL from `chrome.identity.getRedirectURL()` in the background console and add it to the Google OAuth client
3. Replace `PLACEHOLDER.apps.googleusercontent.com` in `extension/wxt.config.ts` with your Google client ID
4. Set up Supabase project (local: `supabase start` or hosted dashboard) with Google OAuth provider enabled
5. Create `extension/.env` with `WXT_SUPABASE_URL`, `WXT_SUPABASE_ANON_KEY`, and `WXT_BACKEND_URL`
6. Start FastAPI backend: `cd backend && uv run uvicorn app.main:app --reload`

## Next Phase Readiness

- Auth foundation complete -- AUTH-01, AUTH-02 implemented
- Pending: Task 4 manual verification (Google OAuth + backend connection end-to-end)
- Phase 2 (core explanation feature) can proceed after Task 4 is approved
- Extension builds cleanly, all automated tests pass

---
*Phase: 01-foundation-and-auth*
*Completed: 2026-03-21*

## Known Stubs

- `extension/entrypoints/sidepanel/components/SignedInView.tsx` line 42: "Your learning dashboard is coming in Phase 2." -- intentional placeholder per plan; Phase 2 will replace with actual notes/topics UI

## Self-Check: PASSED
