# Project Research Summary

**Project:** bubb — AI-powered browser learning extension
**Domain:** Chrome Extension (Manifest V3) + FastAPI backend + Supabase + LLM integration
**Researched:** 2026-03-21
**Confidence:** HIGH

## Executive Summary

bubb is a Chrome extension that lets users highlight any text on any web page and receive a contextual AI explanation, automatically organized into a personal knowledge base. The product sits in a well-defined competitive space (Liner, Readwise, Glasp, Recall) but has a genuinely differentiated angle: Agent Recall, which proactively injects a user's prior learning history into every new explanation. No competitor does this. The recommended architecture is a WXT-built Manifest V3 extension (React, TypeScript, Tailwind CSS, shadcn/ui) paired with a FastAPI backend that acts as the AI proxy, with Supabase handling auth and database. This stack is well-validated, all major libraries have confirmed version compatibility, and the project structure maps cleanly onto Chrome's three execution contexts (content script, side panel, background service worker).

The build order is strongly constrained by dependencies: auth and the database schema must come first because every feature that persists data requires a working user account. The highlight-to-popup interaction is the single most critical piece to get right — it is the product's core value delivery surface — and should come immediately after the foundation is set. Agent Recall is the key differentiator but depends on a populated knowledge base, so it belongs in a later phase after the core explain-and-save loop is working.

The most significant risks are architectural and must be addressed in Phase 1 before any other work proceeds. Service worker state management, Supabase RLS enforcement, and the OAuth redirect URL configuration are all pitfalls that are cheap to prevent but expensive to fix retroactively. The security architecture (API keys never touching the client, all LLM calls proxied through FastAPI) is non-negotiable and must be designed from the start. CSS isolation via Shadow DOM for the popup overlay is similarly foundational — it cannot be bolted on later without a significant rewrite.

## Key Findings

### Recommended Stack

The extension should be built with WXT (the leading MV3 framework as of 2026, replacing Plasmo), React 19, TypeScript 5.7, Tailwind CSS v4, and shadcn/ui. WXT's file-based entrypoints eliminate manifest boilerplate and its `createShadowRootUi` helper solves the CSS isolation problem for the content script popup. The backend is FastAPI (Python 3.12+) with Pydantic v2 — the right call because Python has the best AI library ecosystem. Supabase provides managed Postgres, Google OAuth with Chrome Extension-specific PKCE support, and Row Level Security. Zustand (with `zustand-chrome-storage` middleware) handles cross-context state in the extension; React Query handles server state in the side panel.

See [STACK.md](.planning/research/STACK.md) for full version table, installation commands, and alternatives considered.

**Core technologies:**
- WXT ^0.20.18: Extension build framework — leading MV3 framework with Vite HMR, ~43% smaller bundles than Plasmo, first-class Shadow DOM and side panel support
- React 19 + TypeScript 5.7: UI and type safety — ecosystem maturity and WXT's official module make this the clear pick
- Tailwind CSS v4 + shadcn/ui: Styling and components — Tailwind v4's Shadow DOM compatibility solves content script CSS isolation; shadcn copies source so no dead code
- FastAPI ^0.135 + Pydantic v2: Backend API — async-native, streaming (SSE) support, ideal for AI proxy with Pydantic models for request/response validation
- Supabase: Auth + Postgres — managed, Google OAuth has Chrome Extension PKCE flow as a first-class path, RLS for per-user data isolation
- Zustand ^5 + zustand-chrome-storage: Extension state — lightweight (1.1KB), multi-context sync across service worker and side panel
- OpenAI SDK ^2.29 + Anthropic SDK ^0.86: AI providers — official SDKs, streaming and function calling support

**Critical version note:** Tailwind CSS v4 requires the `@tailwindcss/vite` plugin (not PostCSS). shadcn CLI v4 must be used with Tailwind v4. FastAPI requires Pydantic v2 — v1 is not supported.

### Expected Features

See [FEATURES.md](.planning/research/FEATURES.md) for full competitor analysis and prioritization matrix.

**Must have (table stakes) — launch without these = incomplete product:**
- Highlight-to-popup with contextual AI explanation — the core interaction; no competitor does this well on live web pages
- Follow-up questions in the popup — without this users hit a dead end after the first explanation
- Smart auto-save of every explanation — builds the knowledge base passively; no save button required
- AI-suggested topic labels with reuse from history — avoids topic sprawl; no competitor auto-organizes this way
- Side panel with "This Page" and "Continue Learning" views — users need to browse what they have saved
- Basic full-text search across notes — unusable knowledge base without search
- Google OAuth + cloud sync via Supabase — students use multiple machines; data loss is unacceptable
- User-provided API key management (OpenAI + Anthropic) — BYOK avoids subsidizing API costs during validation

**Should have (differentiators) — these are what set bubb apart:**
- Layered explanation depth (simple / intermediate / technical) — absent from every competitor, low implementation cost
- Agent Recall context injected into new explanations — the core differentiator; no competitor builds on prior learning
- Agent Recall chips displayed in topic view — lets users see their accumulated knowledge per topic
- Per-page view in side panel — shows everything learned on the current URL; surprisingly absent from competitors

**Defer to v1.x (add after validation):**
- PDF support — high engineering cost; web pages first
- Semantic search — full-text search is sufficient for early user counts
- Export notes (Markdown, JSON)
- Note editing and deletion

**Defer to v2+ (explicitly out of scope):**
- Personalized explanation style based on inferred proficiency — requires significant accumulated data
- YouTube / video support
- Spaced repetition / flashcard generation — different product entirely
- Social / collaborative features — adds moderation complexity that doesn't fit bubb's private-first model
- Full-page summarization — commodity feature; every AI extension does it; not bubb's value prop

### Architecture Approach

The system has four distinct components: a Chrome extension (three execution contexts), a FastAPI backend, and Supabase. All inter-component communication inside the extension flows through the background service worker, which acts as the sole message router and HTTP client. The content script renders the popup overlay inside a Shadow DOM for CSS isolation. The side panel is a full React SPA. FastAPI is a thin AI proxy — it receives requests, validates JWTs, fetches Agent Recall context, constructs prompts, calls OpenAI or Anthropic, saves the resulting note to Supabase, and streams the response back. The extension never calls AI providers directly.

See [ARCHITECTURE.md](.planning/research/ARCHITECTURE.md) for the full system diagram, data flow steps, build order, and anti-patterns.

**Major components:**
1. Content Script — text selection detection, page context extraction, popup overlay rendering in Shadow DOM; sends messages to service worker only
2. Background Service Worker — central message router, auth token storage in `chrome.storage.local`, sole HTTP client for FastAPI calls; stateless by design (reconstructs state from storage on every wake)
3. Side Panel — React SPA for browsing notes/topics, "This Page" and "Continue Learning" views, search; fetches data via service worker
4. FastAPI Backend — AI proxy, JWT verification, Agent Recall retrieval, topic matching/suggestion, note persistence to Supabase; never exposes AI API keys to client
5. Supabase — managed Postgres (notes, topics, user_preferences), Google OAuth via PKCE, Row Level Security for per-user data isolation

**Key patterns:**
- Message bus via service worker (all extension IPC)
- Shadow DOM for all injected UI (CSS isolation)
- PKCE OAuth with `chrome.storage.local` token persistence (not localStorage)
- FastAPI as AI proxy (API keys never touch the extension)

### Critical Pitfalls

See [PITFALLS.md](.planning/research/PITFALLS.md) for full details, recovery strategies, and a "looks done but isn't" checklist.

1. **Service worker state loss on restart** — MV3 service workers terminate after ~30 seconds of inactivity; all in-memory state is lost. Prevention: treat the service worker as completely stateless; store all persistent state in `chrome.storage.local` or `chrome.storage.session`; register all event listeners synchronously at the top level, never inside async functions. Must address in Phase 1 — the architecture sets the pattern and retroactive fixes require a rewrite.

2. **Supabase RLS disabled or misconfigured** — New tables have RLS off by default; the anon key (visible in extension code) exposes all rows. A January 2025 incident exposed 170+ apps via this exact mistake. Prevention: add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` to every migration immediately after CREATE TABLE; write `auth.uid()` policies on every table; never use `service_role` key in the extension. Must address in Phase 1.

3. **Google OAuth redirect URL mismatch** — Extension ID changes between unpacked dev and published production builds, breaking auth. Prevention: use `chrome.identity.getRedirectURL()` dynamically; pin extension ID in manifest.json during development; register both dev and prod IDs in Google Cloud Console and Supabase. Must address in Phase 1.

4. **Extension CSS leaking into/from host pages** — Without Shadow DOM, the popup inherits and pollutes host page CSS. Looks fine on test pages, breaks on Gmail, Google Docs, GitHub. Prevention: always render injected UI inside a closed Shadow DOM; inline all CSS; test on CSS-aggressive sites early. Must address in Phase 2 (Core Interaction).

5. **Unbounded LLM token costs** — Sending full page text plus entire conversation history to the LLM; with Agent Recall, costs compound. Prevention: extract only proximate paragraph context (not `document.body.innerText`); cap Agent Recall to top 5-10 relevant notes; set hard token limits per request (e.g., 4K input tokens); track per-user daily usage on backend. Must design this in Phase 3 (AI Integration).

6. **Streaming cut off by service worker termination or reverse proxy buffering** — Long LLM responses killed mid-stream by service worker idle timeout (30s); in production, reverse proxies buffer SSE by default. Prevention: route streaming consumers (content script popup or side panel) as the SSE receiver, not the service worker; set `X-Accel-Buffering: no` and configure `proxy_buffering off` in Nginx. Address in Phase 3 but test against production proxy stack.

7. **API keys stored unencrypted in chrome.storage** — Any extension with the right permissions can read `chrome.storage.local`. Prevention: route all LLM calls through FastAPI; store user API keys server-side in Supabase encrypted at rest; never return keys to the extension. Must be the architecture from Phase 1 — this cannot be migrated easily later.

## Implications for Roadmap

Based on the combined research, the following 5-phase structure is recommended. The ordering is driven by hard dependencies (auth before any data persistence), architectural risk (service worker and RLS must be right from the start), and the feature dependency graph from FEATURES.md.

### Phase 1: Foundation and Infrastructure

**Rationale:** Every other phase depends on this. Auth must exist before any feature that saves data. The service worker architecture, RLS setup, and API key security model must all be decided here — retroactive fixes are expensive. This phase has no visible user-facing output but de-risks everything else.

**Delivers:** Working Supabase schema with RLS on all tables; Google OAuth PKCE flow tested in both unpacked and packed builds; FastAPI skeleton with JWT verification; extension scaffold with WXT, service worker message bus, and stateless architecture pattern established; API key storage architecture (server-side only).

**Addresses pitfalls:** Service worker state loss, Supabase RLS misconfiguration, OAuth redirect URL mismatch, API key storage security — all four must be addressed here.

**Features from FEATURES.md:** Google OAuth sign-in, cloud sync, API key management (architecture only).

**Flag:** Needs research during planning for the Supabase + `chrome.identity` PKCE integration specifics — documented but has known edge cases with FedCM/third-party cookie deprecation.

### Phase 2: Core Interaction — Highlight to Explanation

**Rationale:** This is the product's value delivery surface. Everything else (topics, Agent Recall, side panel) depends on being able to highlight text and get an explanation back. Getting the content script, Shadow DOM popup, and FastAPI explain endpoint working end-to-end is the single most important milestone.

**Delivers:** Text selection detection in content script; Shadow DOM popup overlay with contextual AI explanation (simple depth); FastAPI `/api/explain` endpoint wired to OpenAI or Anthropic; auto-save of note to Supabase; basic popup UI (explanation text, "Go deeper" button placeholder, follow-up question input placeholder).

**Stack elements:** WXT `createShadowRootUi` for Shadow DOM, Tailwind CSS with inline injection, FastAPI streaming endpoint, Supabase Python client for note writes.

**Addresses pitfalls:** Shadow DOM CSS isolation (must be built this way from the start, not retrofitted); service worker as sole HTTP client (content script sends message, service worker calls FastAPI).

**Features from FEATURES.md:** Highlight-to-popup interaction, contextual AI explanations (simple depth).

**Flag:** Standard pattern — Shadow DOM + React mounting is well-documented; skip research-phase for this phase.

### Phase 3: AI Features — Depth, Follow-ups, and Token Management

**Rationale:** Once the basic explain loop works, layer in the features that make explanations actually useful and differentiated. Follow-up questions and layered depth are both high-value, low-cost additions. Token budgeting must be designed here before Agent Recall makes it worse.

**Delivers:** Follow-up questions with conversational context in popup; layered depth (simple / intermediate / technical) via depth parameter on `/api/explain`; token budget enforcement in FastAPI (context trimming, hard caps, per-request token logging); streaming SSE from FastAPI tested against production proxy stack.

**Stack elements:** FastAPI `StreamingResponse` with SSE, `httpx` async streaming for AI calls, Nginx `proxy_buffering off` configuration.

**Addresses pitfalls:** Unbounded token costs (design here), SSE buffering in production (test here), streaming cut off by service worker (route SSE to content script popup directly, not through service worker).

**Features from FEATURES.md:** Follow-up questions in popup, layered explanation depth (simple/intermediate/technical).

**Flag:** SSE streaming through production proxy needs verification against actual deployment stack — standard pattern but one known gotcha with Nginx configuration.

### Phase 4: Knowledge Base — Side Panel, Topics, and Search

**Rationale:** The knowledge base is what differentiates bubb from a one-shot explanation tool. Once notes are being saved (from Phase 2), build the UI to browse and search them. AI topic suggestion with reuse runs after notes exist, so it belongs here. Agent Recall also depends on a populated topic structure.

**Delivers:** Side panel React SPA with "This Page" and "Continue Learning" views; topic list and topic detail views; AI-suggested topic labels on note creation; topic reuse matching against existing user topics (cold start acceptable); basic full-text search across saved notes; source URL attribution and page title stored with every note; side panel virtualized list rendering for 100+ notes.

**Stack elements:** React Query for server state in side panel, Zustand for UI state, shadcn/ui components, `react-window` for virtualized lists, Supabase full-text search.

**Addresses pitfalls:** Side panel performance with large note counts (virtualized rendering); Supabase realtime subscriptions avoided in favor of on-demand fetch.

**Features from FEATURES.md:** Side panel (both views), AI topic labels with reuse, basic search, source URL attribution, per-page learning context view.

**Flag:** AI topic suggestion + reuse involves a topic-matching LLM call; research during planning to confirm whether a lightweight embedding comparison or a second LLM call is the right approach.

### Phase 5: Agent Recall and Knowledge Enrichment

**Rationale:** Agent Recall is the core differentiator but requires a populated knowledge base to provide value. Building it last ensures the underlying notes/topics infrastructure is stable. This phase implements bubb's unique selling point: proactively injecting prior learning into new explanations.

**Delivers:** Agent Recall context retrieval (top-N relevant prior notes by topic match); recall context injected into FastAPI `/api/explain` prompt construction; Agent Recall chips displayed in side panel topic view; relevant prior notes shown in popup when explaining text in a known topic; per-user note count growth validated against token budget caps from Phase 3.

**Stack elements:** PostgreSQL full-text search or pgvector (for future semantic recall), Supabase Python client for recall queries, FastAPI recall service module.

**Addresses pitfalls:** Selective recall (cap at 5-10 notes, not full history) prevents token cost explosion; token budget from Phase 3 validates this holds at scale.

**Features from FEATURES.md:** Agent Recall chips in topic view, Agent Recall context injected into new explanations.

**Flag:** Needs research during planning to determine whether full-text search is sufficient for v1 recall or whether pgvector embeddings are needed from the start. The recall query performance at 500+ notes is a known risk.

### Phase Ordering Rationale

- Foundation before everything else because auth and RLS are not addable retroactively without security exposure.
- Core interaction before knowledge features because topics, Agent Recall, and the side panel all require notes to exist.
- Token management in Phase 3 before Agent Recall in Phase 5 because Agent Recall multiplies context size — the budget must be in place first.
- Side panel and topics (Phase 4) before Agent Recall (Phase 5) because recall requires a stable topic taxonomy to query against.
- This ordering matches the build order recommendation in ARCHITECTURE.md exactly: schema → service worker → auth → content script → AI endpoint → side panel → topic system + Agent Recall.

### Research Flags

Phases that need deeper research during planning:
- **Phase 1 (Foundation):** Supabase + `chrome.identity` PKCE flow has known edge cases with FedCM; the "Authorized Client IDs" configuration in Supabase for Chrome Extension Google OAuth is documented but implementation details warrant research.
- **Phase 4 (Knowledge Base):** AI topic suggestion with reuse — confirm whether a second LLM call for topic matching or an embedding similarity approach is better for latency and cost at the volume expected in v1.
- **Phase 5 (Agent Recall):** Recall query strategy — full-text search vs pgvector; decision affects database schema and cannot be changed without a migration.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Core Interaction):** Shadow DOM + React content script popup is a well-documented pattern; WXT's `createShadowRootUi` handles the hard parts.
- **Phase 3 (AI Features):** FastAPI SSE streaming is well-documented; the streaming pattern with `httpx` async generators is standard.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions confirmed from official npm/PyPI sources and changelogs. Version compatibility matrix verified. WXT community consensus is strong. |
| Features | HIGH | Competitor analysis based on live Chrome Web Store listings and product documentation. Feature dependencies are logically verified, not just asserted. |
| Architecture | HIGH | Patterns sourced from official Chrome Extension docs and Supabase docs. Anti-patterns validated against known MV3 migration issues. Build order is deterministic. |
| Pitfalls | HIGH | Each pitfall sourced from official documentation, CVE reports, or community post-mortems with named incidents (CVE-2025-48757, June 2025 API key leak report). |

**Overall confidence:** HIGH

### Gaps to Address

- **Supabase PKCE + FedCM interaction:** The auth research notes that the `data-use_fedcm_for_prompt` flag may be needed for future-proofing as third-party cookies are deprecated. This needs a concrete implementation decision during Phase 1 planning — defaulting to FedCM-compatible approach is the safe call.
- **Agent Recall retrieval strategy (full-text vs. embeddings):** The architecture research defers this to pgvector "at scale" but does not define the v1 threshold. During Phase 5 planning, establish a note count at which full-text search degrades and decide whether to start with pgvector from the beginning or migrate later.
- **BYOK pricing model transition:** The features research correctly identifies BYOK as a validation-phase strategy, not a mass-market one. The roadmap should include a flag for designing a hosted/subscription tier before scaling user acquisition. This is out of scope for v1 but should not require an architectural change to implement later.
- **Extension ID pinning in development:** The manifest `key` field needed to pin the development extension ID is not automatically generated by WXT. The Phase 1 task list should include generating and committing this key to prevent OAuth breakage when developers switch machines.

## Sources

### Primary (HIGH confidence — official documentation and confirmed versions)

- [WXT Official Site](https://wxt.dev/) — framework features, Shadow DOM integration, side panel support
- [Chrome Extension Developer Docs](https://developer.chrome.com/docs/extensions/) — Content Scripts, Side Panel API, MV3 overview, service worker lifecycle
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google) — Google OAuth Chrome Extension PKCE setup
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS enforcement patterns
- [FastAPI Release Notes](https://fastapi.tiangolo.com/release-notes/) — version and Pydantic v2 compatibility
- [OpenAI Python SDK Releases](https://github.com/openai/openai-python/releases) — version 2.29.0 confirmed
- [Anthropic Python SDK](https://github.com/anthropics/anthropic-sdk-python) — version 0.86.0 confirmed
- [React npm](https://www.npmjs.com/package/react) — version 19.2.4 confirmed
- [Zustand npm](https://www.npmjs.com/package/zustand) — version 5.0.12 confirmed
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — version 2.99.3 confirmed
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — Oxide engine, CSS-based config

### Secondary (MEDIUM confidence — community consensus and implementation guides)

- [2025 State of Browser Extension Frameworks](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/) — WXT vs Plasmo vs CRXJS comparison
- [Supabase Auth in Chrome Extensions](https://pustelto.com/blog/supabase-auth/) — implementation patterns
- [Supabase Auth: What You Won't Find in the Docs](https://chethiyakd.medium.com/supabase-auth-in-a-chrome-extension-what-you-wont-find-in-the-docs-a2ae6691cca3) — PKCE edge cases
- [Chrome Extension Content Script CSS Isolation](https://dev.to/developertom01/solving-css-and-javascript-interference-in-chrome-extensions-a-guide-to-react-shadow-dom-and-best-practices-9l) — Shadow DOM patterns
- [FastAPI SSE for LLM Streaming](https://medium.com/@hadiyolworld007/fastapi-sse-for-llm-tokens-smooth-streaming-without-websockets-001ead4b5e53) — streaming patterns
- [Integrating FastAPI with Supabase Auth](https://dev.to/j0/integrating-fastapi-with-supabase-auth-780) — JWT verification pattern
- Competitor Chrome Web Store listings (Liner, Glasp, Recall, Hypothes.is, Google Dictionary) — feature analysis

### Tertiary (LOW confidence — incident reports and community warnings, needs validation)

- [Supabase Security Flaw: 170+ Apps Exposed by Missing RLS](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) — CVE-2025-48757 incident analysis; validates RLS-first requirement
- [Chrome Extensions Vulnerability Leaks API Keys](https://thehackernews.com/2025/06/popular-chrome-extensions-leak-api-keys.html) — June 2025 incident; validates server-side API key storage requirement

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
