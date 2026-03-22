# Phase 1: Foundation and Auth - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can sign in with Google and have a working cloud-synced account, with the full infrastructure (extension scaffold, backend API, database) operational and secure. AI API keys are stored server-side only and never exposed to the extension.

</domain>

<decisions>
## Implementation Decisions

### Auth Flow UX
- **D-01:** Sign-in uses `chrome.identity.launchWebAuthFlow` (native Google account picker popup), not a new tab redirect
- **D-02:** Signed-out state is "preview mode" — highlight-to-explain works without auth (local only), sign-in unlocks cloud sync
- **D-03:** Session expires after 30 days, requiring re-authentication
- **D-04:** Auth errors show an inline banner in the extension with a retry button (silent refresh attempted first, only show banner if retry fails)

### AI Provider Config
- **D-05:** Default AI provider is OpenAI GPT-4o-mini (bubb-hosted, not user API keys)
- **D-06:** Daily cap on explanations per user (e.g., 50/day) — exact number TBD during implementation
- **D-07:** Usage visibility: hidden until user hits 80%+ of daily cap, then show warning
- **D-08:** When daily cap is reached: soft block with message "Daily limit reached. Resets in [time until reset]." No explanations until reset. Reset is rolling 24 hours from first use, not midnight.

### Database Schema
- **D-09:** Notes table: highlighted_text, explanation, source_url, page_title, topic_id (FK), created_at (timestamptz), user_id
- **D-10:** Topics table: id, name, user_id, note_count, created_at — notes reference via topic_id foreign key
- **D-11:** User preferences: minimal — AI provider preference and daily usage count only
- **D-12:** Include embedding column on notes table now (vector type for future Agent Recall semantic similarity) — avoids migration later
- **D-13:** RLS enabled on all tables from day one — users can only access their own data

### Dev Environment
- **D-14:** Monorepo with /extension and /backend directories in a single git repo
- **D-15:** pnpm for extension (Node.js) package management with workspaces
- **D-16:** uv for FastAPI backend Python environment management
- **D-17:** Supabase CLI for local development (Docker-based, full offline dev, migrations versioned in repo)

### Claude's Discretion
- Extension manifest.json permissions and configuration
- FastAPI project structure and middleware setup
- Supabase migration file organization
- Error handling patterns and logging strategy
- TypeScript configuration
- Environment variable naming and management

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth and Infrastructure
- `.planning/research/ARCHITECTURE.md` — System architecture, component boundaries, MV3 service worker patterns, Supabase PKCE auth flow
- `.planning/research/PITFALLS.md` — Critical pitfalls: service worker termination, RLS misconfiguration, OAuth redirect URL mismatch, API key exposure
- `.planning/research/STACK.md` — Recommended stack versions: WXT, React 19, Supabase, FastAPI, Zustand

### Project Context
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-04 requirements with traceability

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None — patterns will be established in this phase

### Integration Points
- Chrome Extension ↔ FastAPI: JWT-based auth via service worker message passing
- FastAPI ↔ Supabase: Server-side Supabase client with service role key
- FastAPI ↔ OpenAI: Server-side API calls with bubb's API key (never exposed to extension)

</code_context>

<specifics>
## Specific Ideas

- Preview mode before auth is important — users should experience the core interaction before committing to sign up
- Rolling 24-hour reset for daily cap (not midnight) — fairer for users in different timezones
- Embedding column added proactively to notes table to avoid breaking migration when Agent Recall ships in Phase 5

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-and-auth*
*Context gathered: 2026-03-21*
