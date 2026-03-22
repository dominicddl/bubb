# Phase 2: Core Interaction - Research

**Researched:** 2026-03-22
**Domain:** Chrome Extension content script UI (Shadow DOM popup), FastAPI AI proxy, Supabase data persistence
**Confidence:** HIGH

## Summary

Phase 2 transforms the skeleton content script into a working highlight-to-explain interaction. The user selects text on any webpage, a floating popup appears inside a Shadow DOM with an AI explanation from GPT-4o-mini (routed through FastAPI), and the explanation is auto-saved as a note to Supabase. The technical surface area spans four components: (1) content script selection detection and context extraction, (2) Shadow DOM popup UI with React + Tailwind, (3) FastAPI `/api/explain` endpoint calling OpenAI, and (4) note persistence to Supabase with undo capability.

WXT's `createShadowRootUi` with `cssInjectionMode: "ui"` handles the hard part of CSS isolation. The popup uses `position: "overlay"` for floating near the selection. Phase 2 uses non-streaming request/response (streaming deferred to Phase 3), which simplifies the service worker lifecycle -- no keep-alive concerns since the request completes in a single round-trip.

**Primary recommendation:** Use WXT's built-in `createShadowRootUi` with `position: "overlay"` and `cssInjectionMode: "ui"` for the popup. Route the explain request through the background service worker to FastAPI. Save notes server-side from the extension using the Supabase JS client with the user's JWT (RLS-scoped), not from FastAPI with the service role key.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Popup appears automatically on mouseup after text selection (no intermediate button click)
- **D-02:** Minimum selection length: 3+ characters to prevent accidental triggers
- **D-03:** Popup floats near the end of the text selection, repositioning if near viewport edges
- **D-04:** Dismissal: click outside, press Escape, X button, OR auto-dismiss after ~30 seconds of no interaction
- **D-05:** New highlight while popup is open replaces the current popup (single-popup model, previous note already saved)
- **D-06:** Clean card with subtle border, light background, rounded corners, generous padding
- **D-07:** Highlighted text shown as a header at the top of the popup (truncated if long), explanation below
- **D-08:** Explanation text is plain text, conversational tone -- no markdown rendering, no bullet points
- **D-09:** Loading state: skeleton shimmer (animated gray placeholder lines) before content arrives
- **D-10:** Popup size: ~400px wide, max ~300px tall with scroll for long explanations
- **D-11:** Bottom section scaffolds follow-up input + model selector as disabled placeholders (Phase 3)
- **D-12:** X close button in top-right corner of popup
- **D-13:** Auto-save fires immediately when the full explanation arrives from the AI (no delay)
- **D-14:** After save, a toast notification appears at the bottom of the popup: "Note saved [check] [Undo]"
- **D-15:** Undo button deletes the note from Supabase. Toast disappears after 5 seconds
- **D-16:** Signed-out users: explanation still works but save is skipped. Toast shows "Sign in to save notes [Log in]"
- **D-17:** Content script extracts: highlighted text + surrounding paragraph(s) via DOM traversal + page title + source URL
- **D-18:** DOM traversal walks up from selection's anchor node to nearest block-level parent, grabs textContent. If short, also grabs adjacent siblings. Capped at ~500 chars of context
- **D-19:** AI prompt uses neutral tone -- Phase 3 depth levels will own tone/complexity adjustments
- **D-20:** Max explanation length: ~150 words (2-3 short paragraphs)

### Claude's Discretion
- Shadow DOM mounting strategy (WXT's `createShadowRootUi` or manual)
- Tailwind CSS injection approach inside Shadow DOM
- Message protocol extension (new message types for explain requests)
- FastAPI endpoint structure for AI explanation proxy
- OpenAI prompt engineering (system prompt, temperature, model params)
- Error handling for AI API failures, network errors, rate limits
- Toast notification implementation (custom or library)
- Popup z-index and stacking context management

### Deferred Ideas (OUT OF SCOPE)
- Follow-up question logic (CORE-03) -- Phase 3
- Depth level toggles simple/intermediate/technical (CORE-04) -- Phase 3
- Model provider selector functionality -- Phase 3 (UI placeholder scaffolded in Phase 2)
- Streaming AI responses token-by-token -- Phase 3 (Phase 2 uses non-streaming request/response)
- Topic suggestion for saved notes (KB-03) -- Phase 4
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CORE-01 | User can highlight text on any webpage to trigger an explanation popup | Selection detection via `mouseup` + `window.getSelection()`, WXT `createShadowRootUi` for popup rendering in Shadow DOM |
| CORE-02 | AI explanation is contextual -- adapted to surrounding page content | DOM traversal extracts surrounding paragraph context (~500 chars), sent alongside highlighted text to GPT-4o-mini with a system prompt enforcing contextual adaptation |
| CORE-05 | Source URL and page title are stored with every note | Content script has access to `window.location.href` and `document.title`; both are included in the explain request payload and persisted in the `notes` table |
| KB-01 | Every explanation is auto-saved as a note (smart auto-save) | After explanation arrives, extension saves to Supabase `notes` table via `@supabase/supabase-js` with user's JWT (RLS-scoped). topic_id is null for Phase 2 |
| KB-02 | User can dismiss/undo an auto-saved note | Toast with Undo button triggers a Supabase delete by note ID within a 5-second window |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| WXT | ^0.20.18 | Extension framework with `createShadowRootUi` | Built-in Shadow DOM UI creation, CSS injection modes, content script lifecycle management |
| React | ^19.2 | Popup UI rendering inside Shadow DOM | Mounted via `ReactDOM.createRoot` inside shadow root container |
| Tailwind CSS | ^4.2 | Popup styling | Works with `cssInjectionMode: "ui"` to auto-inject into shadow root |
| @supabase/supabase-js | ^2.99 | Note persistence (insert/delete) from extension | Already initialized with chrome.storage adapter in `extension/lib/supabase.ts` |
| openai (Python) | ^2.29 | GPT-4o-mini chat completions | Already in backend `pyproject.toml` dependencies |
| FastAPI | ^0.135 | AI proxy endpoint | Already configured with CORS and JWT auth |

### Supporting (no new dependencies needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Card | installed | Popup card container | Already in `extension/components/ui/card.tsx` |
| shadcn/ui Button | installed | X close, Undo, Log in buttons | Already in `extension/components/ui/button.tsx` |
| lucide-react | installed | X icon for close button | Already available |

### No New Dependencies Required

All libraries needed for Phase 2 are already installed. The popup UI uses existing shadcn components. The toast notification should be a custom component (simple div with timeout) rather than adding a toast library -- it only appears inside the shadow DOM popup and has a single use case.

## Architecture Patterns

### Recommended Content Script Structure
```
extension/
  entrypoints/
    content/              # Content script entrypoint (directory mode)
      index.tsx           # defineContentScript with cssInjectionMode: "ui"
      style.css           # Tailwind imports for shadow root injection
      components/
        ExplanationPopup.tsx  # Main popup React component
        PopupHeader.tsx       # Highlighted text header + X close
        PopupBody.tsx         # Explanation text with scroll
        PopupFooter.tsx       # Placeholder input + model selector (disabled)
        SaveToast.tsx         # Auto-save confirmation + undo
        SkeletonLoader.tsx    # Loading shimmer animation
      lib/
        selection.ts      # Text selection detection + debounce
        context.ts        # DOM traversal for surrounding paragraph extraction
        positioning.ts    # Popup position calculation near selection
  lib/
    messaging.ts          # Extended with EXPLAIN_TEXT message types
backend/
  app/
    routers/
      explain.py          # POST /api/explain endpoint
    services/
      ai.py               # OpenAI client wrapper
    models/
      explain.py          # Pydantic request/response schemas
```

### Pattern 1: WXT Shadow Root UI with Overlay Position
**What:** Use WXT's `createShadowRootUi` with `position: "overlay"` and `cssInjectionMode: "ui"` to create a floating popup attached to the document body, positioned dynamically near the text selection.
**When to use:** Any time the content script needs to render floating UI on the webpage.
**Example:**
```typescript
// extension/entrypoints/content/index.tsx
import './style.css';
import ReactDOM from 'react-dom/client';
import { ExplanationPopup } from './components/ExplanationPopup';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',

  async main(ctx) {
    // Selection listener creates/updates the UI dynamically
    let ui: ShadowRootContentScriptUi<ReactDOM.Root> | null = null;

    document.addEventListener('mouseup', async (event) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text || text.length < 3) return;

      // Remove previous popup if exists
      if (ui) {
        ui.remove();
        ui = null;
      }

      // Get selection position for popup placement
      const range = selection!.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      ui = await createShadowRootUi(ctx, {
        name: 'bubb-popup',
        position: 'overlay',
        anchor: document.body,
        onMount: (container) => {
          const app = document.createElement('div');
          container.append(app);
          const root = ReactDOM.createRoot(app);
          root.render(
            <ExplanationPopup
              selectedText={text}
              selectionRect={rect}
              onClose={() => { ui?.remove(); ui = null; }}
            />
          );
          return root;
        },
        onRemove: (root) => {
          root?.unmount();
        },
      });

      ui.mount();
    });
  },
});
```

### Pattern 2: Content Script CSS for Shadow DOM
**What:** The content script's `style.css` imports Tailwind and the design system CSS variables. With `cssInjectionMode: "ui"`, WXT automatically injects this CSS inside the shadow root only.
**When to use:** Always for content script UI that needs Tailwind.
**Example:**
```css
/* extension/entrypoints/content/style.css */
@import "tailwindcss";

:host {
  /* Reset inherited styles from host page */
  all: initial;
  font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
}

/* Design system variables (subset needed for popup) */
:root {
  --background: 33 26% 93%;
  --foreground: 24 10% 15%;
  --card: 33 20% 97%;
  --card-foreground: 24 10% 15%;
  --border: 33 12% 86%;
  --radius: 0.5rem;
  --accent-green: 142 25% 36%;
  --accent-coral: 4 58% 58%;
}
```
**Important:** Tailwind's default `rem` units reference the host page's root font size, which varies by site. Use `px` values for sizing inside the shadow DOM, or set a fixed `font-size` on the shadow root's `:host` to stabilize `rem`.

### Pattern 3: Message Protocol Extension
**What:** Add `EXPLAIN_TEXT` and `EXPLANATION_RESULT` message types to the existing typed message protocol.
**When to use:** For the content script -> background -> FastAPI -> background -> content script round-trip.
**Example:**
```typescript
// extension/lib/messaging.ts (additions)
export const MessageType = {
  // ... existing auth messages
  EXPLAIN_TEXT: 'EXPLAIN_TEXT',
  EXPLANATION_RESULT: 'EXPLANATION_RESULT',
} as const;

export interface ExplainTextMessage {
  type: typeof MessageType.EXPLAIN_TEXT;
  payload: {
    text: string;          // highlighted text
    context: string;       // surrounding paragraph(s)
    sourceUrl: string;     // window.location.href
    pageTitle: string;     // document.title
  };
}

export interface ExplanationResponse {
  success: boolean;
  explanation?: string;
  noteId?: string;         // UUID from Supabase insert (for undo)
  error?: string;
}
```

### Pattern 4: FastAPI AI Explanation Endpoint
**What:** A single POST endpoint that receives the highlight context, calls GPT-4o-mini, and returns the explanation.
**When to use:** This is the sole AI proxy endpoint for Phase 2.
**Example:**
```python
# backend/app/routers/explain.py
from fastapi import APIRouter, Depends
from openai import AsyncOpenAI
from pydantic import BaseModel
from app.auth.dependencies import get_current_user
from app.config import settings

router = APIRouter()
client = AsyncOpenAI(api_key=settings.openai_api_key)

class ExplainRequest(BaseModel):
    text: str              # highlighted text
    context: str           # surrounding paragraph
    source_url: str
    page_title: str

class ExplainResponse(BaseModel):
    explanation: str

@router.post("/explain", response_model=ExplainResponse)
async def explain_text(
    body: ExplainRequest,
    user: dict = Depends(get_current_user),
):
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful explainer. The user highlighted text on a webpage "
                    "and wants to understand it. Explain the highlighted text in context of "
                    "the surrounding content. Use plain, conversational language. "
                    "Keep your explanation under 150 words (2-3 short paragraphs). "
                    "Do not use bullet points or markdown formatting."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Page: {body.page_title}\n\n"
                    f"Surrounding context:\n{body.context}\n\n"
                    f"Highlighted text:\n{body.text}\n\n"
                    "Explain what the highlighted text means in this context."
                ),
            },
        ],
        temperature=0.3,
        max_tokens=300,
    )
    return ExplainResponse(
        explanation=response.choices[0].message.content or ""
    )
```

### Pattern 5: Note Save from Extension (Not Backend)
**What:** The extension saves the note to Supabase directly using `@supabase/supabase-js` with the user's authenticated session. This avoids adding a save endpoint to FastAPI and leverages RLS naturally.
**When to use:** For Phase 2 note persistence. The user's JWT scopes the insert to their `user_id` via RLS.
**Rationale:** The notes table already has RLS policies (`user_id = auth.uid()`). The Supabase JS client is already initialized in `extension/lib/supabase.ts` with the user's session. Saving from the extension is simpler than adding a FastAPI `/api/notes` endpoint (which would need the service role to bypass RLS or pass through the user's JWT).
**Example:**
```typescript
// Save note after explanation arrives
const { data, error } = await getSupabase()
  .from('notes')
  .insert({
    highlighted_text: selectedText,
    explanation: explanation,
    source_url: sourceUrl,
    page_title: pageTitle,
    // topic_id: null (Phase 4)
    // embedding: null (Phase 4+)
  })
  .select('id')
  .single();

// Undo: delete note by ID
const { error: deleteError } = await getSupabase()
  .from('notes')
  .delete()
  .eq('id', noteId);
```

### Anti-Patterns to Avoid
- **Calling Supabase from content script directly:** Content scripts run in the page's origin. Use background service worker or use `chrome.runtime.sendMessage` to relay Supabase operations if the Supabase client cannot be initialized in the content script context. Test this early.
- **Using `rem` units in Shadow DOM popup:** The host page's root font size varies. Use `px` or set a fixed `:host { font-size: 16px; }` to normalize.
- **Registering mouseup listener without cleanup:** If the content script context is invalidated (navigation, extension reload), the listener leaks. Use `ctx.onInvalidated()` from WXT's ContentScriptContext.
- **Storing popup state in background service worker:** The popup is ephemeral UI. Keep all popup state in the React component. Only pass the explanation result back via message response.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shadow DOM creation + CSS injection | Manual `attachShadow()` + style injection | WXT `createShadowRootUi` with `cssInjectionMode: "ui"` | WXT handles CSS loading (async network fetch), style injection into shadow root, cleanup on context invalidation |
| Popup positioning near selection | Custom absolute positioning with scroll offset math | Use `Range.getBoundingClientRect()` + viewport boundary checks | The browser's built-in range rect already accounts for scroll position; just clamp to viewport edges |
| OpenAI API call from extension | Direct `fetch()` to OpenAI from content script or background | FastAPI proxy endpoint | API keys must stay server-side; proxy also enables rate limiting and prompt control |
| Toast notification library | Install react-hot-toast or similar | Custom 30-line component inside the shadow DOM | Toast only exists in the popup shadow root; a library would add unnecessary weight and may not work in shadow DOM |

## Common Pitfalls

### Pitfall 1: Tailwind rem Units Break in Shadow DOM
**What goes wrong:** Tailwind CSS uses `rem` by default. Inside a Shadow DOM, `rem` still references the host page's `<html>` font size, which varies across websites. Your popup looks different sizes on every page.
**Why it happens:** Shadow DOM isolates CSS cascade but `rem` is always relative to the document root, not the shadow root.
**How to avoid:** Either (a) set `font-size: 16px` on the shadow root's `:host` pseudo-element to normalize `rem`, or (b) use `px` values for critical sizing (width, height, padding). Option (a) is simpler.
**Warning signs:** Popup appears larger on some sites and smaller on others.

### Pitfall 2: Content Script Supabase Client Initialization
**What goes wrong:** The Supabase JS client in `extension/lib/supabase.ts` reads env vars via `import.meta.env`. In content scripts, WXT may not inject these the same way as in the popup/sidepanel entries.
**Why it happens:** Content scripts are bundled separately from popup/sidepanel. Environment variable availability depends on how WXT processes each entrypoint.
**How to avoid:** Test that `getSupabase()` works from the content script context early. If env vars are unavailable, relay note save/delete operations through the background service worker via messages.
**Warning signs:** `getSupabase()` throws "Missing env vars" when called from content script.

### Pitfall 3: Selection Lost After Shadow DOM Mount
**What goes wrong:** Mounting the shadow root UI or calling `createShadowRootUi` can cause the browser to clear the current text selection, so `window.getSelection()` returns empty afterward.
**Why it happens:** DOM mutations (appending elements) can interfere with the active selection in some browsers.
**How to avoid:** Capture the selected text, context, and position BEFORE calling `createShadowRootUi`. Pass them as props to the React component. Never re-read the selection after mounting.
**Warning signs:** Popup mounts but shows empty highlighted text.

### Pitfall 4: Click Outside Dismissal Conflicts with Shadow DOM
**What goes wrong:** A `document.addEventListener('mousedown')` listener to detect "click outside popup" fires for ALL clicks, including clicks inside the popup's shadow root, because the event target from the document's perspective is the shadow host element, not the inner elements.
**Why it happens:** Shadow DOM event retargeting means clicks inside the shadow root appear to come from the host element when observed from outside the shadow.
**How to avoid:** Check if the mousedown target is the shadow host element or a descendant. Use the shadow root's own event listeners to differentiate inside vs outside clicks. Or use `event.composedPath()` to check if the click path includes the shadow host.
**Warning signs:** Popup immediately closes when you try to click inside it.

### Pitfall 5: Auto-dismiss Timer Not Cleared on Interaction
**What goes wrong:** The 30-second auto-dismiss timer fires even while the user is actively reading the explanation or about to click Undo.
**Why it happens:** Timer set on mount, never reset on interaction events.
**How to avoid:** Reset the 30-second timer on any user interaction within the popup (scroll, click, mouse movement). Clear the timer when the user clicks Undo or closes manually.
**Warning signs:** Users report popup disappearing while they are reading it.

### Pitfall 6: Signed-Out User Still Triggers Backend Call
**What goes wrong:** A signed-out user (preview mode) highlights text. The content script sends EXPLAIN_TEXT to background, which calls FastAPI with no auth token. FastAPI returns 401. User sees an error instead of an explanation.
**Why it happens:** The content script doesn't check auth state before requesting an explanation.
**How to avoid:** Two options: (a) check auth state first and show "Sign in to use" for signed-out users (blocks preview mode), or (b) make the `/api/explain` endpoint optionally authenticated -- allow unauthenticated requests but skip note saving. Per D-16, preview mode should still provide explanations, so option (b) is correct. Add an `Optional[dict]` dependency for the user in the explain endpoint.
**Warning signs:** Signed-out users see "Authentication required" error instead of explanation.

### Pitfall 7: Multiple Rapid Highlights Fire Duplicate API Calls
**What goes wrong:** User highlights text, then quickly highlights different text before the first explanation returns. Two API calls fire, two popups try to mount, and the first response arrives after the second popup is showing, causing UI confusion.
**Why it happens:** No cancellation of in-flight requests when a new highlight occurs.
**How to avoid:** Use an AbortController for the fetch request to FastAPI. When D-05 fires (new highlight replaces popup), abort the previous request. Track a "current request ID" and ignore responses from stale requests.
**Warning signs:** Explanation from a previous highlight appears in the popup for a new highlight.

## Code Examples

### Surrounding Context Extraction (D-17, D-18)
```typescript
// extension/entrypoints/content/lib/context.ts
const BLOCK_ELEMENTS = new Set([
  'P', 'DIV', 'SECTION', 'ARTICLE', 'MAIN', 'ASIDE',
  'BLOCKQUOTE', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'PRE', 'FIGURE', 'FIGCAPTION', 'TD', 'TH',
]);

const MAX_CONTEXT_LENGTH = 500;

export function extractSurroundingContext(selection: Selection): string {
  const anchorNode = selection.anchorNode;
  if (!anchorNode) return '';

  // Walk up to nearest block-level parent
  let blockParent = anchorNode.nodeType === Node.ELEMENT_NODE
    ? anchorNode as Element
    : anchorNode.parentElement;

  while (blockParent && !BLOCK_ELEMENTS.has(blockParent.tagName)) {
    blockParent = blockParent.parentElement;
  }

  if (!blockParent) return '';

  let context = blockParent.textContent?.trim() || '';

  // If block parent content is short, grab adjacent siblings
  if (context.length < 200 && blockParent.parentElement) {
    const parent = blockParent.parentElement;
    const siblings = Array.from(parent.children);
    const idx = siblings.indexOf(blockParent);

    const prev = idx > 0 ? siblings[idx - 1].textContent?.trim() : '';
    const next = idx < siblings.length - 1 ? siblings[idx + 1].textContent?.trim() : '';

    context = [prev, context, next].filter(Boolean).join(' ');
  }

  // Cap at MAX_CONTEXT_LENGTH
  if (context.length > MAX_CONTEXT_LENGTH) {
    context = context.substring(0, MAX_CONTEXT_LENGTH) + '...';
  }

  return context;
}
```

### Popup Position Calculation (D-03)
```typescript
// extension/entrypoints/content/lib/positioning.ts
const POPUP_WIDTH = 400;
const POPUP_MAX_HEIGHT = 300;
const VIEWPORT_PADDING = 12;

export function calculatePopupPosition(selectionRect: DOMRect): { top: number; left: number } {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // Default: below the selection, aligned to the end
  let top = selectionRect.bottom + scrollY + 8;
  let left = selectionRect.right + scrollX - POPUP_WIDTH;

  // Clamp left to viewport
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING;
  }
  if (left + POPUP_WIDTH > window.innerWidth - VIEWPORT_PADDING) {
    left = window.innerWidth - VIEWPORT_PADDING - POPUP_WIDTH;
  }

  // If popup would go below viewport, show above selection
  if (selectionRect.bottom + POPUP_MAX_HEIGHT + 8 > window.innerHeight) {
    top = selectionRect.top + scrollY - POPUP_MAX_HEIGHT - 8;
  }

  return { top: Math.max(VIEWPORT_PADDING, top), left };
}
```

### Skeleton Shimmer Loader (D-09)
```tsx
// extension/entrypoints/content/components/SkeletonLoader.tsx
export function SkeletonLoader() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-4/6" />
      <div className="mt-4" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Shadow DOM + inline styles | WXT `createShadowRootUi` with `cssInjectionMode: "ui"` | WXT 0.18+ | Framework handles CSS loading, injection, and cleanup automatically |
| `openai.ChatCompletion.create()` (v0.x) | `client.chat.completions.create()` (v1+) | OpenAI SDK v1.0 (2023) | New SDK is async-native with Pydantic models. Use `AsyncOpenAI` for FastAPI |
| GPT-4o as default | GPT-4o-mini for cost-efficient short explanations | 2024 | 15x cheaper than GPT-4o, sufficient quality for 150-word explanations |
| `document.execCommand` for selections | `window.getSelection()` + Range API | Long standardized | Modern API with proper rect/position support |

## Open Questions

1. **Supabase client accessibility from content script**
   - What we know: `extension/lib/supabase.ts` uses `import.meta.env` for env vars. Works in popup and sidepanel.
   - What's unclear: Whether WXT injects env vars into content script bundles the same way.
   - Recommendation: Test early in Wave 0. If it fails, relay note operations through background via messages. This is a low-cost fallback.

2. **Overlay position control with `createShadowRootUi`**
   - What we know: WXT supports `position: "overlay"` with alignment options like `"top-left"`, `"bottom-right"`.
   - What's unclear: Whether the alignment anchors support arbitrary pixel offsets or only predefined positions.
   - Recommendation: If WXT's overlay positioning is too rigid for "float near selection end," use `position: "inline"` with `anchor: document.body` and apply absolute positioning manually via CSS `style` prop on the container. The popup component itself handles the positioning math.

3. **Preview mode (signed-out) API access**
   - What we know: D-16 says signed-out users can still get explanations but saves are skipped.
   - What's unclear: Whether to make the `/api/explain` endpoint accept unauthenticated requests or to skip the backend entirely for signed-out users.
   - Recommendation: Make `/api/explain` accept optional auth. Use `Depends(get_optional_user)` that returns None for unauthenticated requests. This keeps the API key server-side while allowing preview mode. Consider rate limiting unauthenticated requests more aggressively.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework (extension) | Vitest (already configured) |
| Config file (extension) | `extension/vitest.config.ts` |
| Quick run command | `cd extension && npm run test` |
| Framework (backend) | pytest + pytest-asyncio (already configured) |
| Config file (backend) | `backend/pyproject.toml` [tool.pytest.ini_options] |
| Quick run command | `cd backend && uv run pytest -x` |
| Full suite command | `cd extension && npm run test && cd ../backend && uv run pytest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CORE-01 | Selection detection triggers popup state | unit | `cd extension && npx vitest run tests/content/selection.test.ts` | Wave 0 |
| CORE-01 | Minimum 3-char selection filter | unit | `cd extension && npx vitest run tests/content/selection.test.ts` | Wave 0 |
| CORE-02 | Context extraction from DOM | unit | `cd extension && npx vitest run tests/content/context.test.ts` | Wave 0 |
| CORE-02 | AI prompt includes surrounding context | unit (backend) | `cd backend && uv run pytest tests/test_explain.py -x` | Wave 0 |
| CORE-05 | Source URL and page title in explain request | unit (backend) | `cd backend && uv run pytest tests/test_explain.py -x` | Wave 0 |
| KB-01 | Note insert with correct fields | unit | `cd extension && npx vitest run tests/content/save.test.ts` | Wave 0 |
| KB-02 | Note delete (undo) by ID | unit | `cd extension && npx vitest run tests/content/save.test.ts` | Wave 0 |
| CORE-01 | Full highlight-to-popup flow | manual | Visual test on 3+ diverse websites | manual-only: requires real browser + DOM |
| CORE-02 | Explanation quality is contextual | manual | Read explanations on different page types | manual-only: requires human judgment |

### Sampling Rate
- **Per task commit:** Quick run for the relevant context (extension or backend)
- **Per wave merge:** Full suite command
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `extension/tests/content/selection.test.ts` -- covers CORE-01 (selection detection, min length)
- [ ] `extension/tests/content/context.test.ts` -- covers CORE-02 (DOM context extraction)
- [ ] `extension/tests/content/save.test.ts` -- covers KB-01, KB-02 (note insert/delete)
- [ ] `backend/tests/test_explain.py` -- covers CORE-02, CORE-05 (explain endpoint, prompt structure)

## Sources

### Primary (HIGH confidence)
- [WXT Content Script UI Docs](https://wxt.dev/guide/key-concepts/content-script-ui.html) -- createShadowRootUi API, cssInjectionMode options, position modes
- [WXT createShadowRootUi API Reference](https://wxt.dev/api/reference/wxt/utils/content-script-ui/shadow-root/functions/createshadowrootui) -- Full function signature and types
- [MDN window.getSelection()](https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection) -- Selection API reference
- [OpenAI Chat Completions API](https://platform.openai.com/docs/api-reference/introduction) -- GPT-4o-mini model, non-streaming usage
- [Supabase Python Insert Docs](https://supabase.com/docs/reference/python/insert) -- Server-side insert patterns
- Existing codebase: `extension/lib/messaging.ts`, `extension/lib/supabase.ts`, `backend/app/auth/dependencies.py` -- Established patterns

### Secondary (MEDIUM confidence)
- [WXT + Tailwind Shadow DOM discussion](https://github.com/wxt-dev/wxt/discussions/819) -- rem vs px issue in shadow DOM
- [Content Script UI DeepWiki](https://deepwiki.com/wxt-dev/wxt/5.3-content-script-ui) -- Overlay position documentation
- [Tailwind CSS in Shadow DOM case study](https://dev.to/dhirajarya01/how-i-finally-made-tailwindcss-work-inside-the-shadow-dom-a-real-case-study-5gkl) -- Practical workarounds

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and tested in Phase 1
- Architecture: HIGH -- WXT's createShadowRootUi is well-documented; message pattern extends existing code
- Content script UI (Shadow DOM): MEDIUM -- WXT overlay positioning may need custom positioning fallback; rem/px issue needs testing
- FastAPI explain endpoint: HIGH -- follows exact pattern of existing auth router
- Pitfalls: HIGH -- based on official docs + community reports + prior project research

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable stack, no fast-moving dependencies)
