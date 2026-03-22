---
phase: 01-foundation-and-auth
verified: 2026-03-22T06:00:00Z
status: human_needed
score: 4/4 success criteria verified
re_verification: true
  previous_status: gaps_found
  previous_score: 2/4
  gaps_closed:
    - "Token refresh now uses supabase.auth.signInWithIdToken — real refresh tokens issued by Supabase"
    - "AUTH_STATE_CHANGED broadcast implemented — broadcastAuthStateChanged() called on SIGN_IN and SIGN_OUT"
    - "verifyBackendConnection implemented in auth.ts and called from background.ts after sign-in"
    - "/api/auth/google router removed from main.py — auth is now native Supabase, no backend dependency for sign-in"
    - "Google provider enabled in supabase/config.toml with skip_nonce_check = true for local dev"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "End-to-end Google sign-in flow"
    expected: "User clicks 'Continue with Google', a Chrome tab opens with Google account picker, user selects account, tab closes, side panel shows 'Hey, {firstName}'"
    why_human: "chrome.tabs-based OAuth requires a live browser, Google account, and the extension loaded unpacked — cannot verify programmatically"
  - test: "Session persistence across browser restart"
    expected: "User signs in, closes Chrome completely, reopens Chrome, opens side panel — user is still signed in without re-authenticating"
    why_human: "Requires live browser restart; Supabase client autoRefreshToken behavior in chrome.storage.local context can only be confirmed with a real session"
  - test: "Token auto-refresh after expiry"
    expected: "After the 1-hour JWT expiry, the Supabase client transparently refreshes using the refresh token — user stays signed in with no UI interruption"
    why_human: "Requires either waiting 1 hour or manually manipulating expires_at in chrome.storage.local; autoRefreshToken behavior in a service worker context needs live confirmation"
---

# Phase 01: Foundation and Auth Verification Report

**Phase Goal:** Users can sign in with Google and have a working cloud-synced account, with the full infrastructure (extension, backend, database) operational and secure
**Verified:** 2026-03-22T06:00:00Z
**Status:** human_needed — all automated checks pass, 3 items need live browser confirmation
**Re-verification:** Yes — after gap closure (previous score: 2/4, current score: 4/4)

## Re-verification Summary

All 4 gaps from the initial verification have been resolved:

| Previous Gap | Resolution |
|---|---|
| `refresh_token: ''` — auto-refresh inoperative | `auth.ts` rewritten to call `supabase.auth.signInWithIdToken()` — Supabase issues real access + refresh tokens |
| `AUTH_STATE_CHANGED` never broadcast | `broadcastAuthStateChanged()` implemented in `background.ts`, called after SIGN_IN and SIGN_OUT |
| `verifyBackendConnection` absent | Implemented in `auth.ts` lines 160-173, imported and called in `background.ts` line 53 |
| `/api/auth/google` unregistered + no tests | Router removed from `main.py`; auth is now fully Supabase-native (no backend required for sign-in) |

No regressions introduced.

---

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can sign in to the extension with their Google account in one click | VERIFIED | `signInWithGoogle()` in `auth.ts` opens a tab with `response_type=id_token`, captures the ID token, calls `supabase.auth.signInWithIdToken()`. Sign-in button in `SignedOutView.tsx` is wired through `handleSignIn` → `chrome.runtime.sendMessage(SIGN_IN)` → `background.ts` → `signInWithGoogle()`. Full chain present. |
| 2 | Supabase RLS policies enforce per-user data isolation | VERIFIED (carried from initial) | `supabase/migrations/00002_initial_schema.sql`: 3 tables with ENABLE ROW LEVEL SECURITY, `auth.uid()` in all USING and WITH CHECK clauses. No change since initial verification. |
| 3 | FastAPI backend validates Supabase JWT on protected endpoints and rejects invalid/missing tokens | VERIFIED (carried from initial) | `backend/app/auth/dependencies.py`: `get_current_user` dependency decodes HS256 JWT with `audience="authenticated"`, raises 401 on missing/expired/invalid tokens. `health.py` `/api/health/auth` endpoint requires `Depends(get_current_user)`. No change since initial verification. |
| 4 | Extension stores session securely and auto-refreshes tokens without user intervention | VERIFIED | `supabase.ts` configures `autoRefreshToken: true` with `chromeStorageAdapter`. `auth.ts` now calls `supabase.auth.signInWithIdToken()` which persists a real `access_token` + `refresh_token` pair via the Supabase client — no more `refresh_token: ''`. `getAuthState()` calls `supabase.auth.getSession()` which triggers auto-refresh if needed. Human confirmation still needed to observe real refresh behavior. |

**Score:** 4/4 success criteria verified (automated evidence)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `extension/lib/supabase.ts` | Supabase client with chrome.storage.local adapter | VERIFIED | `chromeStorageAdapter` imported from `storage.ts` and set as `auth.storage`; `autoRefreshToken: true`, `persistSession: true` |
| `extension/lib/auth.ts` | Google OAuth ID token flow + sign out + backend verify | VERIFIED | `signInWithGoogle()` uses `response_type=id_token` + `supabase.auth.signInWithIdToken()`; `signOut()` calls `supabase.auth.signOut()`; `verifyBackendConnection()` fetches `/api/health/auth` with Bearer token |
| `extension/lib/messaging.ts` | Typed message contracts | VERIFIED | All 4 message types defined: SIGN_IN, SIGN_OUT, GET_AUTH_STATE, AUTH_STATE_CHANGED; typed interfaces present |
| `extension/lib/storage.ts` | Chrome storage adapter | VERIFIED (carried from initial) | In-memory cache + `chrome.storage.local`; no change |
| `extension/tests/lib/storage-adapter.test.ts` | Unit tests for storage adapter | VERIFIED (carried from initial) | 7 unit tests; no change |
| `extension/entrypoints/background.ts` | Auth message handler with broadcast | VERIFIED | Handles SIGN_IN/SIGN_OUT/GET_AUTH_STATE; calls `broadcastAuthStateChanged()` after SIGN_IN (line 50) and SIGN_OUT (line 71); calls `verifyBackendConnection()` after sign-in (line 53) |
| `extension/entrypoints/sidepanel/App.tsx` | Side panel with signed-in/out states + AUTH_STATE_CHANGED listener | VERIFIED | Both states rendered; `AUTH_STATE_CHANGED` listener active on mount (lines 40-50); `handleSignIn` / `handleSignOut` wired |
| `extension/entrypoints/sidepanel/components/SignedOutView.tsx` | Sign-in button UI | VERIFIED (carried from initial) | Google button, loading state, branding present |
| `extension/entrypoints/sidepanel/components/SignedInView.tsx` | Signed-in greeting | VERIFIED (carried from initial) | "Hey, {firstName}" rendered, sign-out confirmation present |
| `extension/entrypoints/sidepanel/components/AuthErrorBanner.tsx` | Error banner with retry | VERIFIED (carried from initial) | AlertCircle, dismiss X, retry button present |
| `backend/app/auth/dependencies.py` | JWT verification FastAPI dependency | VERIFIED (carried from initial) | `get_current_user` with HS256, `audience="authenticated"`, expired/invalid error handling |
| `backend/app/auth/supabase.py` | Server-side Supabase admin client | VERIFIED (carried from initial) | `create_client` with service role key |
| `backend/app/routers/health.py` | Health check endpoints (public + auth-gated) | VERIFIED (carried from initial) | `/api/health` (no auth) and `/api/health/auth` (`Depends(get_current_user)`) |
| `supabase/migrations/00002_initial_schema.sql` | Notes, topics, user_preferences with RLS | VERIFIED (carried from initial) | 3 tables, 3x ENABLE ROW LEVEL SECURITY, `auth.uid()` in all policies |
| `supabase/config.toml` | Google OAuth provider enabled | VERIFIED | `[auth.external.google]` block present with `enabled = true`, `client_id = "env(GOOGLE_OAUTH_CLIENT_ID)"`, `skip_nonce_check = true` |
| `backend/app/routers/auth.py` | NOT wired to app (dead code) | NOTE | File still exists but is not imported or registered in `main.py`. The old `/api/auth/google` endpoint is inert. Low risk — orphaned file, not a blocker. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `sidepanel/App.tsx` | `background.ts` | `chrome.runtime.sendMessage` | WIRED | `sendMessage` calls for SIGN_IN, SIGN_OUT, GET_AUTH_STATE on lines 24, 56, 75 |
| `background.ts` | `lib/auth.ts` | `signInWithGoogle()` on SIGN_IN | WIRED | `case MessageType.SIGN_IN: { const result = await signInWithGoogle()` |
| `lib/auth.ts` | `lib/supabase.ts` | `supabase.auth.signInWithIdToken` | WIRED | `import { supabase } from './supabase'` (line 1); `supabase.auth.signInWithIdToken(...)` (line 73) — gap from initial verification is closed |
| `lib/supabase.ts` | `chrome.storage.local` | `chromeStorageAdapter` | WIRED | `import { chromeStorageAdapter } from './storage'`; set as `auth.storage` |
| `background.ts` | All UI contexts | `AUTH_STATE_CHANGED` broadcast | WIRED | `broadcastAuthStateChanged()` calls `chrome.runtime.sendMessage({type: MessageType.AUTH_STATE_CHANGED, ...})` — gap from initial verification is closed |
| `background.ts` | `backend /api/health/auth` | Authenticated fetch with JWT | WIRED | `verifyBackendConnection()` imported from `auth.ts`; called at line 53 after sign-in; fetches `${BACKEND_URL}/api/health/auth` with `Authorization: Bearer` header — gap from initial verification is closed |
| `backend/app/main.py` | `backend/app/routers/health.py` | `app.include_router` | WIRED | `include_router(health.router, prefix="/api")` present |
| `backend/app/auth/dependencies.py` | `backend/app/config.py` | `settings.supabase_jwt_secret` | WIRED | `settings.supabase_jwt_secret` used in `jwt.decode` call |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUTH-01 | 01-03-PLAN.md | User can sign in with Google OAuth (one-click) | VERIFIED | `signInWithGoogle()` opens tab with Google account picker; `signInWithIdToken()` creates Supabase session; wired end-to-end through background message handler. Needs human confirmation of UX (one-click feel). |
| AUTH-02 | 01-03-PLAN.md | User session persists across browser restarts | VERIFIED | `supabase.auth.signInWithIdToken()` issues real refresh tokens stored via `chromeStorageAdapter` to `chrome.storage.local` (survives restarts); `autoRefreshToken: true` handles expiry. Needs human confirmation of live refresh behavior. |
| AUTH-03 | 01-01-PLAN.md, 01-02-PLAN.md | User data syncs across devices via cloud storage | VERIFIED (carried) | Supabase Postgres schema with RLS policies in place; cloud sync infrastructure operational |
| AUTH-04 | 01-01-PLAN.md, 01-02-PLAN.md | AI explanations powered by hosted API (no user API key) | VERIFIED (carried) | `openai_api_key` server-side only in backend config; never referenced in extension source |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `extension/lib/auth.ts` | 43 | Raw nonce sent to Google (not SHA-256 hashed) | Warning | The plan's SUMMARY states "SHA-256 hash sent to Google, raw nonce sent to Supabase." The implementation sends the same raw UUID to both. Locally this is masked by `skip_nonce_check = true` in `supabase/config.toml`. On a hosted Supabase project where `skip_nonce_check` defaults to `false`, sign-in will fail nonce verification. Not a blocker for local dev but must be fixed before production deployment. |
| `backend/app/routers/auth.py` | — | Orphaned file — not registered in `main.py` | Info | Old backend token exchange endpoint still exists in the repo but is not wired. Harmless but should be deleted to avoid confusion about whether it is intentionally inactive. |

---

### Human Verification Required

#### 1. Google Sign-In End-to-End Flow

**Test:** Load the extension unpacked in Chrome, open the side panel, click "Continue with Google"
**Expected:** A Chrome tab opens with Google's account picker. After selecting an account, the tab closes automatically and the side panel transitions to the signed-in state showing "Hey, {firstName}"
**Why human:** `chrome.tabs`-based OAuth requires a live browser with an active Google account and the extension loaded. The flow involves a real tab navigation that cannot be simulated programmatically.

#### 2. Session Persistence Across Browser Restart

**Test:** Sign in successfully. Close Chrome completely (not just the tab). Reopen Chrome. Open the side panel.
**Expected:** The user is still signed in — the side panel shows the signed-in greeting without any re-authentication prompt.
**Why human:** Requires a live browser restart. The `chromeStorageAdapter` writes to `chrome.storage.local` which persists across restarts, but the actual behavior of the Supabase client restoring a session from storage in a new service worker context needs live confirmation.

#### 3. Token Auto-Refresh

**Test:** Sign in. Manually edit `chrome.storage.local` (via Chrome DevTools > Application > Storage > Extension storage) to set the session's `expires_at` to a past Unix timestamp. Then trigger any auth-checking action (e.g., reload the side panel).
**Expected:** The Supabase client detects the expired access token, uses the stored refresh token to silently obtain a new session, and the user remains signed in with no error shown.
**Why human:** `autoRefreshToken: true` relies on the Supabase JS client's internal timer and token exchange logic. Confirming it works correctly in the service worker context (which can be suspended) requires live observation.

---

### Anti-Pattern Detail: Nonce Hashing Deviation

The plan's SUMMARY and key-decisions section explicitly document: "Nonce hashing: SHA-256 hash sent to Google, raw nonce sent to Supabase for verification." The correct pattern for `signInWithIdToken` is:

1. Generate a raw nonce
2. SHA-256 hash it
3. Send the **hash** in the Google OAuth `nonce` param (Google embeds this in the ID token's `nonce` claim)
4. Send the **raw nonce** to `supabase.auth.signInWithIdToken({ nonce: rawNonce })`
5. Supabase hashes the raw nonce itself and compares to the token's `nonce` claim to verify

The current implementation sends the raw UUID to both Google and Supabase. `skip_nonce_check = true` in the local `supabase/config.toml` suppresses the verification failure locally. This is a deviation from the intended security design that must be corrected before connecting to a hosted Supabase project.

---

### Notes on Remaining File

`backend/app/routers/auth.py` still exists but is not imported in `main.py`. The old `/api/auth/google` endpoint is inert — it cannot be reached. The gap-closure plan stated the endpoint would be "removed from main.py," which was done. The file itself was not deleted. No functional impact, but the file is dead code that misrepresents the current auth architecture.

---

## Summary

All four phase goal success criteria now have automated evidence of implementation. The three critical gaps from the initial verification — broken token refresh, missing broadcast, and absent backend verification — are all resolved. The phase's infrastructure is complete and structurally sound.

The only remaining items are:

1. **Human confirmation** of the live sign-in flow, session persistence, and token auto-refresh (these cannot be proven by static analysis alone)
2. A **warning-level deviation** in nonce handling that is harmless locally but must be fixed before production deployment
3. An **orphaned file** (`backend/app/routers/auth.py`) that should be deleted for clarity

The phase goal is achieved for development purposes. AUTH-01 and AUTH-02 are structurally satisfied. AUTH-03 and AUTH-04 remain verified from the initial pass.

---

_Verified: 2026-03-22T06:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — initial score was 2/4, current score is 4/4_
