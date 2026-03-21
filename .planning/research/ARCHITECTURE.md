# Architecture Research

**Domain:** Chrome Extension AI Learning Tool (MV3 + FastAPI + Supabase)
**Researched:** 2026-03-21
**Confidence:** HIGH

## System Overview

```
 BROWSER (Chrome)                                 BACKEND
 ========================================         ========================

  Content Script        Side Panel (React)         FastAPI Server
  (per webpage)         (persistent UI)            +-----------------+
  +--------------+      +-----------------+        | /api/explain    |
  | Text select  |      | "This Page"     |        | /api/topics     |
  | detection    |      |  notes list     |        | /api/notes      |
  | Popup overlay|      | "Continue       |        | /api/followup   |
  | (Shadow DOM) |      |  Learning"      |        | JWT validation  |
  +------+-------+      |  topic browser  |        | AI proxy        |
         |              +--------+--------+        +-------+---------+
         |                       |                         |
         +----------+------------+                         |
                    |                                      |
           Background Service Worker                       |
           +---------------------------+                   |
           | Message router            |                   |
           | Auth state (chrome.storage)|    HTTPS/JSON    |
           | API client                +-------------------+
           | Tab tracking              |                   |
           +---------------------------+                   |
                                                           |
                                                   Supabase
                                                   +------------------+
                                                   | Auth (Google     |
                                                   |   OAuth + PKCE)  |
                                                   | PostgreSQL       |
                                                   |   (notes, topics,|
                                                   |    user prefs)   |
                                                   | Row Level        |
                                                   |   Security (RLS) |
                                                   +------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Content Script** | Detects text selection on webpages, renders explanation popup overlay, extracts page context (surrounding text, URL, title) | Vanilla JS/TS for selection detection + React rendered in Shadow DOM for popup UI |
| **Side Panel** | Persistent UI for browsing notes and topics, "This Page" and "Continue Learning" views, search, topic drill-in | React SPA loaded via `sidePanel.default_path`, communicates with service worker via `chrome.runtime` messaging |
| **Background Service Worker** | Central message router between content script and side panel, holds auth tokens in `chrome.storage`, makes API calls to FastAPI, manages extension lifecycle | Event-driven JS/TS, registers all listeners at top level, uses `chrome.storage.local` for state persistence |
| **FastAPI Backend** | AI proxy (routes to OpenAI or Anthropic based on user preference), business logic (topic matching, Agent Recall), JWT verification for auth | Python FastAPI with async endpoints, validates Supabase JWTs, calls AI provider APIs |
| **Supabase** | Authentication (Google OAuth via PKCE flow), PostgreSQL database for notes/topics/preferences, Row Level Security for per-user data isolation | Managed service, accessed directly by backend and indirectly by extension through FastAPI |

## Recommended Project Structure

```
bubb/
├── extension/                  # Chrome Extension (MV3)
│   ├── src/
│   │   ├── background/         # Service worker
│   │   │   ├── index.ts        # Entry point, event listener registration
│   │   │   ├── messages.ts     # Message router (content <-> side panel)
│   │   │   ├── api-client.ts   # HTTP client for FastAPI calls
│   │   │   └── auth.ts         # Auth state management, token refresh
│   │   ├── content/            # Content script (injected into webpages)
│   │   │   ├── index.ts        # Entry point, selection listener
│   │   │   ├── selection.ts    # Text selection detection logic
│   │   │   ├── context.ts      # Page context extraction (surrounding text)
│   │   │   └── popup/          # Explanation popup overlay
│   │   │       ├── App.tsx     # React root for popup (rendered in Shadow DOM)
│   │   │       ├── mount.ts    # Shadow DOM creation + React mounting
│   │   │       └── components/ # Popup-specific React components
│   │   ├── sidepanel/          # Side panel UI
│   │   │   ├── index.html      # Side panel HTML entry
│   │   │   ├── App.tsx         # React root
│   │   │   ├── pages/          # This Page view, Continue Learning view, Topic detail
│   │   │   ├── components/     # Shared side panel components
│   │   │   └── hooks/          # Custom hooks (useNotes, useTopics, useAuth)
│   │   ├── shared/             # Shared between all extension contexts
│   │   │   ├── types.ts        # Message types, data models
│   │   │   ├── constants.ts    # API URLs, storage keys
│   │   │   └── storage.ts      # chrome.storage wrapper utilities
│   │   └── popup/              # Browser action popup (minimal — login prompt or redirect to side panel)
│   │       ├── index.html
│   │       └── App.tsx
│   ├── public/
│   │   └── icons/              # Extension icons (16, 32, 48, 128)
│   ├── manifest.json           # MV3 manifest
│   ├── wxt.config.ts           # WXT build configuration
│   ├── tailwind.config.ts
│   └── package.json
├── backend/                    # FastAPI server
│   ├── app/
│   │   ├── main.py             # FastAPI app, CORS, middleware
│   │   ├── auth/
│   │   │   ├── dependencies.py # JWT verification dependency
│   │   │   └── supabase.py     # Supabase client setup
│   │   ├── routers/
│   │   │   ├── explain.py      # AI explanation endpoints
│   │   │   ├── notes.py        # CRUD for notes
│   │   │   ├── topics.py       # Topic management + matching
│   │   │   └── recall.py       # Agent Recall context retrieval
│   │   ├── services/
│   │   │   ├── ai_provider.py  # AI provider abstraction (OpenAI/Anthropic)
│   │   │   ├── topic_matcher.py # AI-powered topic suggestion + reuse
│   │   │   └── recall.py       # Agent Recall logic
│   │   ├── models/
│   │   │   └── schemas.py      # Pydantic models
│   │   └── config.py           # Environment config
│   ├── requirements.txt
│   └── Dockerfile
├── supabase/                   # Supabase local config + migrations
│   ├── config.toml
│   └── migrations/
│       └── 001_initial.sql     # Notes, topics, user_preferences tables
└── .planning/                  # Project planning docs
```

### Structure Rationale

- **`extension/` and `backend/` as top-level siblings:** Clear monorepo separation. Each has its own package manager, build tool, and deploy target. No shared code between them (communication is HTTP only).
- **`extension/src/background/`, `content/`, `sidepanel/`:** Mirrors the three execution contexts of a Chrome Extension. Each has its own entry point and isolated scope. This is the convention for WXT-based projects.
- **`extension/src/shared/`:** Types and utilities shared across all three extension contexts. Keep this minimal -- primarily TypeScript types for message passing contracts and storage key constants.
- **`extension/src/content/popup/`:** The explanation overlay is a React app mounted inside a Shadow DOM on the webpage. Kept under `content/` because it is injected by the content script.
- **`backend/app/routers/` vs `services/`:** Routers handle HTTP concerns (request parsing, auth dependency injection, response formatting). Services contain business logic (AI calls, topic matching). This separation keeps endpoints thin.
- **`supabase/migrations/`:** SQL migrations tracked in version control. Supabase CLI applies them locally and to production.

## Architectural Patterns

### Pattern 1: Message Bus via Background Service Worker

**What:** All inter-component communication flows through the background service worker. Content scripts and the side panel never talk directly to each other. The service worker acts as a message router.

**When to use:** Always in MV3 extensions with multiple UI surfaces (content script + side panel + popup).

**Trade-offs:** Adds indirection but provides a single point of control for auth, caching, and API calls. Prevents content scripts from needing network permissions or auth tokens.

**Example:**
```typescript
// shared/types.ts — Typed message contract
type Message =
  | { type: "EXPLAIN_TEXT"; payload: { text: string; context: string; url: string } }
  | { type: "EXPLANATION_READY"; payload: { noteId: string; explanation: string } }
  | { type: "GET_PAGE_NOTES"; payload: { url: string } }
  | { type: "NOTES_UPDATED"; payload: { notes: Note[] } };

// background/messages.ts — Central router
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  switch (message.type) {
    case "EXPLAIN_TEXT":
      handleExplainText(message.payload).then(sendResponse);
      return true; // Keep channel open for async response
    case "GET_PAGE_NOTES":
      handleGetPageNotes(message.payload).then(sendResponse);
      return true;
  }
});

// content/selection.ts — Content script sends message
const response = await chrome.runtime.sendMessage({
  type: "EXPLAIN_TEXT",
  payload: { text: selectedText, context: surroundingText, url: window.location.href }
});
```

### Pattern 2: Shadow DOM Isolation for Content Script UI

**What:** The explanation popup overlay is a React component rendered inside a Shadow DOM attached to the webpage. This provides complete CSS isolation in both directions: the host page's styles cannot affect the popup, and the popup's styles cannot leak into the page.

**When to use:** Any time an extension injects visible UI into a webpage. This is non-negotiable for bubb -- the popup must look consistent across every website.

**Trade-offs:** Adds complexity to mounting React (need custom mount function). CSS must be inlined into the Shadow DOM (cannot use external stylesheets). Closed Shadow DOM prevents page JS from accessing the popup.

**Example:**
```typescript
// content/popup/mount.ts
import popupStyles from "./styles.css?inline"; // Vite inlines as string

export function mountPopup(anchorElement: HTMLElement) {
  const host = document.createElement("div");
  host.id = "bubb-popup-host";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "closed" });

  // Inject isolated styles
  const style = document.createElement("style");
  style.textContent = popupStyles;
  shadow.appendChild(style);

  // Mount React into Shadow DOM
  const container = document.createElement("div");
  shadow.appendChild(container);
  const root = createRoot(container);
  root.render(<PopupApp selectedText={...} />);
}
```

### Pattern 3: Auth Token Flow (Supabase PKCE + chrome.storage)

**What:** Google OAuth uses the PKCE flow (not implicit) because `chrome.identity.launchWebAuthFlow` strips URL hash fragments (where implicit flow tokens live). PKCE puts the auth code in the query string, which survives. Tokens are stored in `chrome.storage.local` (not localStorage, which service workers lack).

**When to use:** Any Chrome Extension using Supabase Auth with OAuth providers.

**Trade-offs:** More complex than standard web auth. Requires custom storage adapter for Supabase client. Must handle token refresh when service worker wakes up.

**Flow:**
```
User clicks "Sign in with Google"
    |
    v
chrome.identity.launchWebAuthFlow (PKCE)
    |
    v
Google OAuth consent screen
    |
    v
Redirect with ?code=xxx (PKCE code in query string)
    |
    v
Supabase exchangeCodeForSession(code)
    |
    v
Access token + refresh token stored in chrome.storage.local
    |
    v
Service worker includes access token in Authorization header to FastAPI
    |
    v
FastAPI verifies JWT using Supabase JWT secret
```

### Pattern 4: FastAPI as AI Proxy (Never Expose API Keys to Client)

**What:** The extension never calls OpenAI/Anthropic directly. All AI requests go through FastAPI, which adds the user's API key (stored server-side or passed per-request) and handles rate limiting, prompt construction, and response formatting.

**When to use:** Always. AI API keys in a Chrome Extension can be extracted by users or other extensions.

**Trade-offs:** Adds latency (extra network hop). But provides security, prompt engineering control, and the ability to inject Agent Recall context server-side.

**Note on user-provided API keys:** Per PROJECT.md, users provide their own API keys. These should be stored encrypted in Supabase (per-user), retrieved server-side by FastAPI, and never sent back to the extension. The extension only knows which provider the user selected, not the key itself.

## Data Flow

### Core Flow: Highlight Text to Get Explanation

```
1. User highlights text on webpage
       |
       v
2. Content Script detects selection (mouseup + window.getSelection())
       |
       v
3. Content Script extracts context (surrounding paragraph text, page URL, title)
       |
       v
4. Content Script sends message to Service Worker:
   { type: "EXPLAIN_TEXT", payload: { text, context, url, title } }
       |
       v
5. Service Worker retrieves auth token from chrome.storage.local
       |
       v
6. Service Worker calls FastAPI: POST /api/explain
   Headers: Authorization: Bearer <supabase_jwt>
   Body: { text, context, url, title, depth: "simple" }
       |
       v
7. FastAPI verifies JWT, looks up user's AI provider + API key
       |
       v
8. FastAPI fetches Agent Recall context: prior notes on related topics
       |
       v
9. FastAPI constructs prompt with page context + recall context
       |
       v
10. FastAPI calls OpenAI/Anthropic API, gets explanation
       |
       v
11. FastAPI auto-generates topic suggestion (or matches existing topic)
       |
       v
12. FastAPI saves note to Supabase (text, explanation, topic, url, timestamp)
       |
       v
13. FastAPI returns: { noteId, explanation, suggestedTopic, existingTopicMatch }
       |
       v
14. Service Worker forwards response to Content Script
       |
       v
15. Content Script renders popup overlay in Shadow DOM with:
    - Explanation text
    - Topic chip (accept / edit / skip)
    - "Go deeper" button
    - Follow-up question input
       |
       v
16. Service Worker also notifies Side Panel: { type: "NOTES_UPDATED" }
       |
       v
17. Side Panel refreshes "This Page" view
```

### State Management

```
chrome.storage.local (extension-wide persistent state)
    |
    ├── auth_tokens: { access_token, refresh_token, expires_at }
    ├── user_preferences: { ai_provider, theme }
    └── cache: { recent_topics[] }  (lightweight cache for topic suggestions)

Supabase PostgreSQL (source of truth for all user data)
    |
    ├── notes: { id, user_id, text, explanation, topic_id, source_url, page_title, depth, created_at }
    ├── topics: { id, user_id, label, note_count, created_at }
    └── user_preferences: { user_id, ai_provider, encrypted_api_key, created_at }

Side Panel React State (ephemeral, in-memory)
    |
    ├── currentView: "this_page" | "continue_learning" | "topic_detail"
    ├── notes[]: fetched from backend on view change
    ├── topics[]: fetched from backend
    └── searchQuery: string
```

### Key Data Flows

1. **Explain flow:** Content Script -> Service Worker -> FastAPI -> AI Provider -> Supabase (save) -> Service Worker -> Content Script (popup) + Side Panel (refresh)
2. **Browse notes flow:** Side Panel -> Service Worker -> FastAPI -> Supabase (query) -> Service Worker -> Side Panel (render)
3. **Auth flow:** Popup/Side Panel -> chrome.identity -> Google OAuth -> Supabase PKCE exchange -> chrome.storage.local -> Service Worker (attaches to all API calls)
4. **Drill deeper flow:** Popup "Go deeper" button -> Service Worker -> FastAPI `/api/explain` with `depth: "intermediate"` -> same return path as explain flow

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Single FastAPI instance, Supabase free/pro tier, no caching. This is fine for months. |
| 1k-10k users | Add Redis for caching frequent topic lookups and AI response caching (same explanation for same text). Rate limit per user. |
| 10k+ users | Multiple FastAPI workers behind a load balancer. Consider streaming AI responses (SSE) for better UX. Supabase connection pooling via PgBouncer. |

### Scaling Priorities

1. **First bottleneck: AI API latency.** Each explanation requires an external AI API call (1-5 seconds). Fix with streaming responses (return partial explanation as it generates) and optional response caching for identical highlights.
2. **Second bottleneck: Database queries for Agent Recall.** As users accumulate hundreds of notes, the "find related prior notes" query grows. Fix with PostgreSQL full-text search or pgvector for semantic similarity matching.

## Anti-Patterns

### Anti-Pattern 1: Storing State in Service Worker Memory

**What people do:** Use global variables in the service worker to cache auth tokens, user preferences, or recent API responses.
**Why it's wrong:** MV3 service workers are ephemeral. Chrome terminates them after ~30 seconds of inactivity. All in-memory state is lost on every wake cycle. This causes auth failures, stale data, and hard-to-reproduce bugs.
**Do this instead:** Use `chrome.storage.local` for all persistent state. Read from storage on every service worker activation. Wrap it in a thin async getter: `const token = await getStoredToken()`.

### Anti-Pattern 2: Content Script Calling Backend Directly

**What people do:** Have the content script make `fetch()` calls directly to the FastAPI backend, bypassing the service worker.
**Why it's wrong:** Content scripts run in the webpage's origin. CORS becomes complex (every website is a different origin). Auth tokens would need to be accessible in the content script context, which is less secure. You also lose centralized error handling and retry logic.
**Do this instead:** Content scripts communicate only with the service worker via `chrome.runtime.sendMessage()`. The service worker is the sole HTTP client.

### Anti-Pattern 3: CSS Injection Without Shadow DOM

**What people do:** Inject the explanation popup directly into the page DOM with global CSS classes.
**Why it's wrong:** The popup inherits the page's CSS (fonts, colors, box-sizing, resets). It looks different on every website. Page CSS updates can break the popup. The popup's CSS can also break the host page layout.
**Do this instead:** Always render injected UI inside a closed Shadow DOM. Inline all CSS into the shadow root.

### Anti-Pattern 4: Registering Event Listeners Asynchronously in Service Worker

**What people do:** Register `chrome.runtime.onMessage` listeners inside an async `init()` function or after an `await` call.
**Why it's wrong:** When Chrome wakes the service worker to dispatch an event, it runs the script from the top. If listeners are registered asynchronously, the event fires before the listener exists, and the message is silently dropped.
**Do this instead:** Register all event listeners synchronously at the top level of the service worker script. Do async initialization inside the handler, not before registering it.

### Anti-Pattern 5: Using Supabase Client Directly from Extension

**What people do:** Initialize the Supabase JS client in the extension and use it to query the database directly (bypassing FastAPI).
**Why it's wrong:** Supabase's JS client uses localStorage for session management by default, which does not exist in service workers. More importantly, direct database access from the extension means Row Level Security is your only defense, and you cannot add business logic (topic matching, recall enrichment) to queries.
**Do this instead:** The extension authenticates via Supabase (for OAuth), but all data operations go through FastAPI endpoints. FastAPI uses the Supabase Python client server-side with proper JWT verification.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | PKCE OAuth flow via `chrome.identity.launchWebAuthFlow` | Must use PKCE, not implicit flow. Custom `chrome.storage` adapter needed for token persistence. |
| Supabase PostgreSQL | Accessed via FastAPI using `supabase-py` client | Enable RLS on all tables. FastAPI service role key for admin operations, user JWT for scoped queries. |
| OpenAI API | Called server-side from FastAPI | User's API key stored encrypted in Supabase. Never sent to extension. |
| Anthropic API | Called server-side from FastAPI | Same pattern as OpenAI. Abstract behind a common `AIProvider` interface. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Content Script <-> Service Worker | `chrome.runtime.sendMessage` / `onMessage` | Typed message contract. Always return `true` for async responses. |
| Side Panel <-> Service Worker | `chrome.runtime.sendMessage` / `onMessage` | Same message bus. Side panel can also use `chrome.storage.onChanged` to react to state changes. |
| Service Worker <-> FastAPI | HTTPS REST (JSON) | Bearer token auth. Consider streaming (SSE) for AI responses later. |
| FastAPI <-> Supabase | `supabase-py` client | Service role for migrations/admin. User JWT passthrough for RLS-scoped reads. |
| FastAPI <-> AI Providers | HTTPS REST | Per-user API key. Wrap in `AIProvider` abstraction for OpenAI/Anthropic swap. |

## Build Order (Dependencies)

The following build order respects component dependencies:

1. **Supabase schema + FastAPI skeleton** -- Database tables (notes, topics, user_preferences) and basic FastAPI endpoints must exist before any frontend work can meaningfully test against real data.
2. **Extension scaffold (WXT) + Service Worker** -- Set up the extension project, manifest, and service worker message router. This is the backbone that everything else plugs into.
3. **Auth flow** -- Supabase Google OAuth (PKCE) in the extension, JWT verification in FastAPI. Must work before any authenticated feature.
4. **Content Script + Popup overlay** -- Text selection detection, Shadow DOM popup rendering, message passing to service worker. This is the core interaction.
5. **AI explanation endpoint** -- FastAPI `/api/explain` with AI provider abstraction. Connect content script flow end-to-end.
6. **Side Panel** -- React UI for notes/topics. Depends on notes existing in the database (from step 5).
7. **Topic system + Agent Recall** -- AI topic suggestion, topic matching/reuse, recall context injection. Enhancement layer on top of working explain + notes flow.

## Sources

- [Chrome Content Scripts documentation](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [Chrome Side Panel API reference](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
- [Chrome Manifest V3 overview](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
- [Supabase Auth in a Chrome Extension: What You Won't Find in the Docs](https://chethiyakd.medium.com/supabase-auth-in-a-chrome-extension-what-you-wont-find-in-the-docs-a2ae6691cca3)
- [Chrome Extension MV3 Template: Supabase Auth, Plasmo](https://dev.to/remusris/chrome-extension-mv3-template-supabase-auth-plasmo-tailwinds-css-shadcn-ui-1m9)
- [The 2025 State of Browser Extension Frameworks: Plasmo vs WXT vs CRXJS](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)
- [Solving CSS and JavaScript Interference in Chrome Extensions: Shadow DOM](https://dev.to/developertom01/solving-css-and-javascript-interference-in-chrome-extensions-a-guide-to-react-shadow-dom-and-best-practices-9l)
- [Using Shadow DOM to isolate injected browser extension components](https://kaangenc.me/2024.05.18.using-shadow-dom-to-isolate-injected-browser-extension-compo/)
- [Integrating FastAPI with Supabase Auth](https://dev.to/j0/integrating-fastapi-with-supabase-auth-780)
- [Chrome Extension Service Workers: Migrate to service workers](https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers)

---
*Architecture research for: Chrome Extension AI Learning Tool (bubb)*
*Researched: 2026-03-21*
