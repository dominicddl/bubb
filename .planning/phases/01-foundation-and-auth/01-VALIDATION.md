---
phase: 1
slug: foundation-and-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (extension)** | Vitest 4.1.0 |
| **Framework (backend)** | pytest (latest via uv) |
| **Config file (extension)** | none — Wave 0 installs |
| **Config file (backend)** | none — Wave 0 installs |
| **Quick run command (extension)** | `cd extension && pnpm vitest run --reporter=verbose` |
| **Quick run command (backend)** | `cd backend && uv run pytest -x -q` |
| **Full suite command** | `cd extension && pnpm vitest run && cd ../backend && uv run pytest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command for the relevant project (extension or backend)
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01, AUTH-02 | unit | `cd extension && pnpm vitest run tests/lib/storage-adapter.test.ts` | Wave 0 | pending |
| 01-02-01 | 02 | 1 | AUTH-03 | integration | `cd backend && uv run pytest tests/test_rls.py -x` | Wave 0 | pending |
| 01-03-01 | 03 | 2 | AUTH-04 | unit | `cd backend && uv run pytest tests/test_auth.py -x` | Wave 0 | pending |
| 01-03-02 | 03 | 2 | AUTH-01 | manual | Manual — requires browser interaction with Google popup | N/A | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [ ] `extension/vitest.config.ts` — Vitest configuration for WXT project
- [ ] `extension/tests/lib/storage-adapter.test.ts` — Tests custom chrome.storage.local adapter
- [ ] `backend/tests/conftest.py` — Shared pytest fixtures (test client, mock JWT)
- [ ] `backend/tests/test_auth.py` — JWT verification dependency tests
- [ ] `backend/tests/test_rls.py` — Supabase RLS policy verification (requires local Supabase running)

*Wave 0 creates test stubs before implementation begins.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google OAuth popup flow completes and returns session | AUTH-01 | OAuth popup requires real browser interaction with Google consent screen | 1. Load unpacked extension in Chrome 2. Click sign-in button 3. Complete Google sign-in popup 4. Verify session stored in chrome.storage.local |
| Session persists after browser restart | AUTH-02 | Requires actual browser close/reopen cycle | 1. Sign in 2. Close Chrome completely 3. Reopen Chrome 4. Verify still signed in without re-auth prompt |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
