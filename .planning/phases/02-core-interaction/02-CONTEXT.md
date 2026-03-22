# Phase 2: Core Interaction - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can highlight text on any webpage and instantly receive a contextual AI explanation in a floating popup (Shadow DOM-isolated). Every explanation is automatically saved as a note with source URL and page title. Users can dismiss or undo an auto-saved note. Follow-up questions and depth levels are Phase 3 scope — this phase scaffolds the input area but doesn't implement the logic.

</domain>

<decisions>
## Implementation Decisions

### Highlight Trigger & Popup Behavior
- **D-01:** Popup appears automatically on mouseup after text selection (no intermediate button click)
- **D-02:** Minimum selection length: 3+ characters to prevent accidental triggers
- **D-03:** Popup floats near the end of the text selection, repositioning if near viewport edges
- **D-04:** Dismissal: click outside, press Escape, X button, OR auto-dismiss after ~30 seconds of no interaction
- **D-05:** New highlight while popup is open replaces the current popup (single-popup model, previous note already saved)

### Explanation Popup Design
- **D-06:** Clean card with subtle border, light background, rounded corners, generous padding — similar to a testimonial/quote card style
- **D-07:** Highlighted text shown as a header at the top of the popup (truncated if long), explanation below
- **D-08:** Explanation text is plain text, conversational tone — no markdown rendering, no bullet points
- **D-09:** Loading state: skeleton shimmer (animated gray placeholder lines) before content arrives
- **D-10:** Popup size: ~400px wide, max ~300px tall with scroll for long explanations
- **D-11:** Bottom section of popup has input text placeholder for follow-up questions (Phase 3) and model provider selector — scaffolded as disabled/placeholder UI in Phase 2
- **D-12:** X close button in top-right corner of popup

### Auto-save & Undo UX
- **D-13:** Auto-save fires immediately when the full explanation arrives from the AI (no delay)
- **D-14:** After save, a toast notification appears at the bottom of the popup: "Note saved ✓ [Undo]"
- **D-15:** Undo button deletes the note from Supabase. Toast disappears after 5 seconds
- **D-16:** Signed-out users (preview mode per Phase 1 D-02): explanation still works but save is skipped. Toast shows "Sign in to save notes [Log in]" instead

### Page Context Extraction
- **D-17:** Content script extracts: highlighted text + surrounding paragraph(s) via DOM traversal + page title + source URL
- **D-18:** DOM traversal walks up from selection's anchor node to nearest block-level parent (p, div, section, article), grabs textContent. If short, also grabs adjacent siblings. Capped at ~500 chars of context
- **D-19:** AI prompt uses neutral tone (no student-specific language) — Phase 3 depth levels will own tone/complexity adjustments
- **D-20:** Max explanation length: ~150 words (2-3 short paragraphs). Keeps popup readable and token costs low

### Claude's Discretion
- Shadow DOM mounting strategy (WXT's `createShadowRootUi` or manual)
- Tailwind CSS injection approach inside Shadow DOM
- Message protocol extension (new message types for explain requests)
- FastAPI endpoint structure for AI explanation proxy
- OpenAI prompt engineering (system prompt, temperature, model params)
- Error handling for AI API failures, network errors, rate limits
- Toast notification implementation (custom or library)
- Popup z-index and stacking context management

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Extension Architecture
- `.planning/research/ARCHITECTURE.md` — Content script ↔ background ↔ backend message flow, Shadow DOM patterns
- `.planning/research/PITFALLS.md` — Service worker termination (keep-alive for streaming), content script isolation, CSP issues
- `.planning/research/STACK.md` — WXT content script UI APIs, React in Shadow DOM, Tailwind CSS injection

### Database Schema
- `supabase/migrations/00002_initial_schema.sql` — Notes table schema (highlighted_text, explanation, source_url, page_title, topic_id, embedding, user_id)

### Existing Code
- `extension/entrypoints/content.ts` — Skeleton content script (currently just logs "loaded") — this is where selection listener lives
- `extension/entrypoints/background.ts` — Message handler with auth routing — extend for AI explanation messages
- `extension/lib/messaging.ts` — Typed message protocol — add EXPLAIN_TEXT and related message types
- `backend/app/main.py` — FastAPI app — add AI explanation router
- `backend/app/config.py` — Already has `openai_api_key` configured
- `backend/app/routers/auth.py` — Auth endpoint pattern to follow for new AI router

### Phase 1 Decisions
- `01-CONTEXT.md` D-02 — Preview mode (signed-out users can still use highlight-to-explain locally)
- `01-CONTEXT.md` D-05 — OpenAI GPT-4o-mini as default AI provider
- `01-CONTEXT.md` D-06/D-07/D-08 — Daily usage cap with rolling 24h reset, visibility at 80%+

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `extension/components/ui/card.tsx` — shadcn Card component for popup card styling
- `extension/components/ui/button.tsx` — shadcn Button for X close, Undo, Log in buttons
- `extension/components/ui/badge.tsx` — Could be used for status indicators
- `extension/lib/supabase.ts` — Supabase client (for saving notes)
- `extension/lib/auth.ts` — Auth utilities (for checking signed-in state before save)
- `extension/lib/storage.ts` — Chrome storage adapter (for any local caching needs)

### Established Patterns
- Message-passing via `chrome.runtime.sendMessage` with typed `MessageType` enum and `ExtensionMessage` union type
- Background script handles all external API calls (auth, and now AI)
- CORS configured in FastAPI for `chrome-extension://*` origins
- Pydantic models for FastAPI request/response schemas

### Integration Points
- Content script → Background: `chrome.runtime.sendMessage({ type: 'EXPLAIN_TEXT', payload: {...} })`
- Background → FastAPI: HTTP POST to `/api/explain` with JWT auth header
- FastAPI → OpenAI: Server-side API call with bubb's API key
- FastAPI → Supabase: Save note via service role client (or extension-side via user's JWT)

</code_context>

<specifics>
## Specific Ideas

- Popup card design inspired by clean quote/testimonial card style — subtle border, generous padding, large readable text, rounded corners
- Bottom section of popup scaffolds follow-up input + model selector as disabled placeholders for Phase 3
- The popup should feel native to the page — not like a browser extension overlay. Clean and unobtrusive
- Auto-save should be invisible to the flow — user highlights, reads explanation, moves on. Save happens silently with a subtle confirmation

</specifics>

<deferred>
## Deferred Ideas

- Follow-up question logic (CORE-03) — Phase 3
- Depth level toggles simple/intermediate/technical (CORE-04) — Phase 3
- Model provider selector functionality — Phase 3 (UI placeholder scaffolded in Phase 2)
- Streaming AI responses token-by-token — Phase 3 (Phase 2 uses non-streaming request/response)
- Topic suggestion for saved notes (KB-03) — Phase 4

</deferred>

---

*Phase: 02-core-interaction*
*Context gathered: 2026-03-22*
