# Phase 1: Foundation and Auth - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 01-foundation-and-auth
**Areas discussed:** Auth flow UX, AI provider config, Database schema, Dev environment

---

## Auth Flow UX

| Option | Description | Selected |
|--------|-------------|----------|
| Chrome identity popup | Uses chrome.identity API — native Google account picker popup | ✓ |
| New tab redirect | Opens a new tab for Google OAuth, redirects back after auth | |
| You decide | Claude picks the best approach for MV3 + Supabase | |

**User's choice:** Chrome identity popup
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal gate | Extension icon opens a simple sign-in prompt — no features visible until authenticated | |
| Preview mode | Highlight-to-explain works without auth (local only), sign-in unlocks cloud sync | ✓ |
| You decide | Claude picks the simplest approach for v1 | |

**User's choice:** Preview mode
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Never (until sign out) | Refresh token keeps them signed in indefinitely | |
| After 30 days | Session expires monthly, re-sign-in required | ✓ |
| You decide | Claude picks a reasonable session policy | |

**User's choice:** After 30 days
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Silent retry | Try to refresh silently; only show error if retry fails | |
| Inline banner | Show a non-blocking banner in the extension with retry button | ✓ |
| You decide | Claude handles error UX | |

**User's choice:** Inline banner
**Notes:** None

---

## AI Provider Config

| Option | Description | Selected |
|--------|-------------|----------|
| OpenAI (GPT-4o-mini) | Fast, cheap, good enough for explanations — best cost/quality ratio | ✓ |
| Anthropic (Claude Haiku) | Fast, cheap, strong at explanations — similar cost to GPT-4o-mini | |
| You decide | Claude picks the best default based on cost/quality | |

**User's choice:** OpenAI (GPT-4o-mini)
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Daily cap | e.g., 50 explanations per day — simple to implement and explain | ✓ |
| Monthly quota | e.g., 500 explanations per month — more flexible but needs tracking UI | |
| No limits (v1) | Don't limit for now — monitor costs manually during early users | |
| You decide | Claude picks a sensible default | |

**User's choice:** Daily cap
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show usage | Transparent counter so users know how many they've used | |
| Hide until near limit | Only show when they hit 80%+ of daily cap | ✓ |
| You decide | Claude picks the right UX for usage visibility | |

**User's choice:** Hide until near limit
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Soft block | Show message in popup: 'Daily limit reached. Resets at midnight.' | ✓ |
| Degrade gracefully | Switch to shorter/cheaper explanations instead of blocking entirely | |
| You decide | Claude handles the limit-reached UX | |

**User's choice:** Soft block with rolling 24-hour reset
**Notes:** User specified "Resets in CURRENT_TIME + 24 hours later" — rolling window, not midnight reset

---

## Database Schema

| Option | Description | Selected |
|--------|-------------|----------|
| Core fields | highlighted_text, explanation, source_url, page_title, topic_id, timestamp, user_id | ✓ |
| Extended fields | Core + depth_level, conversation_history, page_context_snippet | |
| You decide | Claude designs the schema to support all v1 requirements | |

**User's choice:** Core fields with timestamptz
**Notes:** User explicitly specified timestamptz for the timestamp column

---

| Option | Description | Selected |
|--------|-------------|----------|
| Separate table | topics table (id, name, user_id, note_count, created_at) — notes reference via topic_id FK | ✓ |
| Tags on notes | topic_name stored directly on each note | |
| You decide | Claude designs topic storage | |

**User's choice:** Separate table
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal | Just AI provider preference and daily usage count | ✓ |
| Standard | AI provider, theme preference, default explanation depth, usage stats | |
| You decide | Claude designs user preferences | |

**User's choice:** Minimal
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, plan ahead | Add embedding column on notes table now (for future semantic similarity) | ✓ |
| No, keep minimal | Only what Phase 1 needs — add columns via migrations when Phase 5 starts | |
| You decide | Claude judges the tradeoff | |

**User's choice:** Yes, plan ahead
**Notes:** Proactively add vector embedding column to avoid breaking migration later

---

## Dev Environment

| Option | Description | Selected |
|--------|-------------|----------|
| Monorepo | Single repo with /extension and /backend directories | ✓ |
| Separate repos | extension/ and backend/ as separate git repos | |
| You decide | Claude picks based on project size and team | |

**User's choice:** Monorepo
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| pnpm (Recommended) | Fast, disk-efficient, great monorepo support with workspaces | ✓ |
| npm | Standard, no extra install needed | |
| You decide | Claude picks the best fit | |

**User's choice:** pnpm
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| uv (Recommended) | Fast Rust-based Python package manager | ✓ |
| Poetry | Mature dependency management with lock files | |
| pip + venv | Simple, standard, no extra tools | |
| You decide | Claude picks the best fit | |

**User's choice:** uv
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase CLI (local) | Run Supabase locally via Docker — full offline dev, migrations versioned in repo | ✓ |
| Cloud project only | Use a Supabase cloud project for dev — simpler but requires internet | |
| You decide | Claude picks the right dev setup | |

**User's choice:** Supabase CLI (local)
**Notes:** None

---

## Claude's Discretion

- Extension manifest.json permissions and configuration
- FastAPI project structure and middleware setup
- Supabase migration file organization
- Error handling patterns and logging strategy
- TypeScript configuration
- Environment variable naming and management

## Deferred Ideas

None — discussion stayed within phase scope
