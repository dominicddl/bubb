# bubb Stress Test Report

**Date**: 2026-04-01
**Target**: https://bubb-api.onrender.com (production)
**Method**: Playwright MCP — API-level stress testing
**Branch**: dom/stress-test

---

## Summary

| Category | Pass | Fail | Warning |
|----------|------|------|---------|
| Health & Baseline | 1 | 0 | 0 |
| Streaming (all depths/providers) | 1 | 0 | 1 |
| Rate Limiting | 1 | 1 | 0 |
| Concurrent Streams | 1 | 0 | 0 |
| Edge-Case Payloads | 1 | 0 | 0 |
| Follow-Up & Conversation | 1 | 0 | 0 |
| Provider Switching | 1 | 0 | 0 |
| Validation & Errors | 1 | 0 | 0 |
| Security / UI | 0 | 1 | 0 |
| **Total** | **8** | **2** | **1** |

---

## BUGS FOUND

### BUG-1: Rate limiter bypassed by concurrent requests (HIGH)

**Scenario**: 3 (Rate limit verification)
**Severity**: HIGH — allows unlimited AI API calls, directly costs money

**Steps to reproduce**:
1. Send 8 concurrent (Promise.all) POST requests to `/api/explain/stream` from the same IP
2. All 8 return 200 — should only allow 5 for unauthenticated users

**Root cause**: SlowAPI's in-memory storage backend is not atomic. When requests arrive simultaneously, they all read the counter before any of them increment it (TOCTOU race condition).

**Fix options**:
- Use Redis backend for SlowAPI (`slowapi.middleware` supports it)
- Use `limits` library with Redis storage
- Add a per-request asyncio Lock (quick fix, works for single-process)

**Note**: Sequential rate limiting works correctly (6th sequential request gets 429).

---

### BUG-2: Swagger/ReDoc/OpenAPI exposed in production (MEDIUM)

**Scenario**: 9 (UI & security check)
**Severity**: MEDIUM — information disclosure

**Endpoints exposed**:
- `GET /docs` — Swagger UI (interactive API explorer)
- `GET /redoc` — ReDoc documentation
- `GET /openapi.json` — Full API schema with all models

**Risk**: Attackers can map the entire API surface, understand request schemas, and craft targeted requests. While endpoints are auth-gated, this lowers the barrier.

**Fix**:
```python
# In main.py, conditionally disable in production:
import os
is_prod = os.getenv("ENVIRONMENT", "development") == "production"
app = FastAPI(
    title="bubb API",
    version="0.1.0",
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json",
)
```

---

## WARNING

### WARN-1: Anthropic SSE chunking differs significantly from OpenAI

**Scenario**: 2 (Streaming all depths/providers)

**Observation**: OpenAI sends one token per SSE event (61-232 events). Anthropic sends large multi-token chunks (4-25 events).

**Impact**: If the frontend renders per-SSE-event, OpenAI will appear to type smoothly while Anthropic will render in visible bursts. This affects perceived performance.

**Recommendation**: The frontend should split large SSE chunks into smaller pieces for smoother rendering, or use requestAnimationFrame-based rendering to normalize the visual cadence regardless of chunk size.

---

## PASSED TESTS

### TEST-1: Health check & cold start baseline — PASS

- 5 rapid sequential calls: 184ms, 189ms, 198ms, 207ms, 265ms
- All returned `{"status":"ok","database":"connected"}`
- No degradation under rapid fire
- Server was already warm (no cold start observed)

### TEST-2: Streaming explanations (all depths/providers) — PASS

| Depth | Provider | Time | Tokens |
|-------|----------|------|--------|
| simple | openai | 3087ms | 61 |
| standard | openai | 3843ms | 138 |
| deep | openai | 3911ms | 232 |
| simple | anthropic | 1567ms | 4 |
| standard | anthropic | 2787ms | 14 |

All produced valid, contextual explanations. Depth system prompts correctly vary output length.

### TEST-3: Sequential rate limiting — PASS

- Requests 1-5: 200 OK (101-195ms each)
- Request 6: 429 with `{"detail":"Rate limit exceeded. 5 per 1 minute","retry_after":60}`
- Request 7: 429 (confirmed sticky)
- Retry-After header present

### TEST-4: Concurrent streaming (multi-tab simulation) — PASS

- 3 simultaneous streams (different depths, different providers)
- Wall time: 4.7s (near single-stream max, not 3x — proper async concurrency)
- All streams completed with valid content
- No garbled output or dropped connections

### TEST-5: Edge-case payloads — PASS

| Input | Status | Result |
|-------|--------|--------|
| Tiny text (3 chars: "DNA") | 200 | Valid explanation |
| Max text (5000 chars) | 200 | Handled correctly |
| Over max (5001 chars) | 422 | Clean validation error |
| Unicode & emojis | 200 | All special chars handled |
| Code snippet | 200 | Correctly explains JS code |

### TEST-6: Follow-up questions & spam — PASS

- Initial explanation: 5.6s, correct
- Follow-up with conversation history: 2.6s, contextually aware (discussed chlorophyll after photosynthesis)
- 3 concurrent follow-up questions: All 200, 3.3-3.8s each

### TEST-7: Provider switch mid-conversation — PASS

- OpenAI initial → Anthropic follow-up with carried-over conversation history
- Anthropic correctly answered "Why can nothing go faster?" in context of prior speed-of-light explanation
- Provider switch is seamless at the API level

### TEST-8: Validation & error handling — PASS

| Test | Status | Error message |
|------|--------|---------------|
| Missing text field | 422 | "Field required" |
| Invalid provider "gemini" | 422 | "Input should be 'anthropic' or 'openai'" |
| Invalid depth "expert" | 422 | "Input should be 'simple', 'standard' or 'deep'" |
| Empty body | 422 | Lists all 4 missing fields |
| 21 conversation turns | 422 | "List should have at most 20 items" |

### TEST-9: CORS — PASS

- Request from `https://evil-site.com` with OPTIONS preflight: 405, no CORS headers returned
- Browser would block cross-origin requests from unauthorized origins

---

## Not Tested (requires auth / extension)

These scenarios require a valid JWT or the Chrome extension installed:
- Scenarios 13-17: Note CRUD (create, duplicate, delete, topic assignment)
- Scenarios 18-22: Side panel interactions
- Scenarios 23-26: Auth flows (cold start was tested, but idle token refresh needs real token)
- Scenarios 27-31: Extension content script edge cases (empty pages, PDFs, iframes, RTL)

---

## Recommendations (Priority Order)

1. **Fix BUG-1**: Switch SlowAPI to Redis backend to fix concurrent rate limit bypass
2. **Fix BUG-2**: Disable /docs, /redoc, /openapi.json in production
3. **Address WARN-1**: Normalize SSE chunk rendering in frontend for consistent streaming feel
4. **Next round**: Test authenticated endpoints with a real JWT token to cover note/topic CRUD scenarios
