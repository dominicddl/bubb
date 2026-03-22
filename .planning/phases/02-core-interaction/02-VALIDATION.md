---
phase: 2
slug: core-interaction
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (extension) / pytest (backend) |
| **Config file** | `extension/vitest.config.ts` / `backend/pyproject.toml` |
| **Quick run command** | `cd extension && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd extension && npx vitest run && cd ../backend && uv run pytest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd extension && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd extension && npx vitest run && cd ../backend && uv run pytest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | CORE-01 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | CORE-02 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | CORE-05 | unit | `uv run pytest` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | KB-01 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | KB-02 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `extension/tests/content-script.test.ts` — stubs for CORE-01 (selection detection), CORE-02 (popup rendering)
- [ ] `backend/tests/test_explain.py` — stubs for CORE-05 (AI explanation endpoint)
- [ ] `extension/tests/note-save.test.ts` — stubs for KB-01 (auto-save), KB-02 (undo)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shadow DOM CSS isolation | CORE-02 | CSS leak detection requires visual inspection on real pages | Load extension on 5 different sites, verify popup styles don't leak |
| Popup positioning near selection | CORE-01 | Viewport edge behavior requires real browser geometry | Select text near all 4 viewport edges, verify popup repositions |
| Preview mode (signed-out) | CORE-05 | Auth state requires real Chrome extension context | Sign out, highlight text, verify explanation appears without save |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
