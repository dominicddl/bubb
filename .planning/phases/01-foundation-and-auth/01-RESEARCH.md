# Phase 1: Foundation and Auth - Research

**Researched:** 2026-03-21
**Domain:** Chrome Extension (MV3) scaffolding, Google OAuth via Supabase, FastAPI JWT auth, Supabase schema with RLS
**Confidence:** HIGH

## Summary

Phase 1 establishes the three pillars of bubb's infrastructure: (1) a WXT-based Chrome Extension with background service worker, side panel, and content script entrypoints; (2) a FastAPI backend that validates Supabase JWTs and proxies AI requests; and (3) a Supabase Postgres database with RLS-protected tables for notes, topics, and user preferences. The auth flow uses `chrome.identity.launchWebAuthFlow` to get a Google ID token, which is exchanged with Supabase via `signInWithIdToken`, and the resulting JWT is stored in `chrome.storage.local` via a custom storage adapter. The JWT is then sent to FastAPI in Authorization headers for all API calls.

The primary complexity in this phase is the auth flow. Chrome extensions cannot use standard web OAuth redirects. The ID token flow (not PKCE code exchange) is the recommended approach per Supabase's official docs -- `chrome.identity.launchWebAuthFlow` gets a Google ID token via `response_type=id_token`, and Supabase's `signInWithIdToken` exchanges it for a session. A custom `chrome.storage.local` adapter is required because service workers lack `localStorage`. All event listeners in the service worker must be registered synchronously at the top level to avoid missed events after restart.

**Primary recommendation:** Build in order: (1) monorepo scaffold with WXT + FastAPI + Supabase CLI, (2) database schema with RLS, (3) auth flow end-to-end, (4) health check endpoint proving JWT validation works. Do NOT attempt AI integration in this phase -- just prove the auth plumbing works.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Sign-in uses `chrome.identity.launchWebAuthFlow` (native Google account picker popup), not a new tab redirect
- **D-02:** Signed-out state is "preview mode" -- highlight-to-explain works without auth (local only), sign-in unlocks cloud sync
- **D-03:** Session expires after 30 days, requiring re-authentication
- **D-04:** Auth errors show an inline banner in the extension with a retry button (silent refresh attempted first, only show banner if retry fails)
- **D-05:** Default AI provider is OpenAI GPT-4o-mini (bubb-hosted, not user API keys)
- **D-06:** Daily cap on explanations per user (e.g., 50/day) -- exact number TBD during implementation
- **D-07:** Usage visibility: hidden until user hits 80%+ of daily cap, then show warning
- **D-08:** When daily cap is reached: soft block with message. Rolling 24-hour reset from first use.
- **D-09:** Notes table: highlighted_text, explanation, source_url, page_title, topic_id (FK), created_at (timestamptz), user_id
- **D-10:** Topics table: id, name, user_id, note_count, created_at
- **D-11:** User preferences: minimal -- AI provider preference and daily usage count only
- **D-12:** Include embedding column on notes table now (vector type for future Agent Recall)
- **D-13:** RLS enabled on all tables from day one
- **D-14:** Monorepo with /extension and /backend directories
- **D-15:** pnpm for extension package management with workspaces
- **D-16:** uv for FastAPI backend Python environment management
- **D-17:** Supabase CLI for local development (Docker-based, migrations versioned in repo)

### Claude's Discretion
- Extension manifest.json permissions and configuration
- FastAPI project structure and middleware setup
- Supabase migration file organization
- Error handling patterns and logging strategy
- TypeScript configuration
- Environment variable naming and management

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign in with Google OAuth (one-click) | Chrome Extension ID token flow via `chrome.identity.launchWebAuthFlow` + Supabase `signInWithIdToken`. See Architecture Patterns > Auth Flow. |
| AUTH-02 | User session persists across browser restarts | Custom `chrome.storage.local` adapter for Supabase client. Session stored persistently, auto-refresh on service worker wake. 30-day expiry per D-03. |
| AUTH-03 | User data syncs across devices via cloud storage | Supabase Postgres with RLS. Schema includes notes, topics, user_preferences tables. All data scoped by `user_id = auth.uid()`. |
| AUTH-04 | AI explanations are powered by hosted API (bubb-managed, no user API key required) | FastAPI backend with bubb's own OpenAI API key (GPT-4o-mini). Key stored as server-side env var, never exposed to extension. Daily cap tracking in user_preferences table. |
</phase_requirements>

## Standard Stack

### Core (Phase 1 specific)

| Library | Version | Purpose | Verified |
|---------|---------|---------|----------|
| WXT | 0.20.20 | Extension build framework (MV3) | npm registry 2026-03-21 |
| @wxt-dev/module-react | 1.2.2 | React integration for WXT | npm registry 2026-03-21 |
| React | 19.2.4 | UI rendering (side panel, popup) | npm registry 2026-03-21 |
| TypeScript | ^5.7 | Type safety | Per CLAUDE.md stack |
| @supabase/supabase-js | 2.99.3 | Extension-side Supabase client (auth only in Phase 1) | npm registry 2026-03-21 |
| FastAPI | 0.135.1 | Backend API server | PyPI 2026-03-21 |
| Pydantic | 2.12.5 | Data validation & schemas | PyPI 2026-03-21 |
| uvicorn | 0.42.0 | ASGI server | PyPI 2026-03-21 |
| PyJWT | 2.12.1 | Supabase JWT verification in FastAPI | PyPI 2026-03-21 |
| httpx | 0.28.1 | Async HTTP client for FastAPI tests | PyPI 2026-03-21 |
| supabase (Python) | 2.28.3 | Server-side Supabase client | PyPI 2026-03-21 |
| openai (Python) | 2.29.0 | OpenAI API client (GPT-4o-mini) | PyPI 2026-03-21 |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| pnpm | latest | Extension package management (D-15) |
| uv | latest | Python environment management (D-16) |
| Supabase CLI | latest | Local dev with Docker, migrations (D-17) |
| Biome | 2.4.8 | JS/TS linting + formatting |
| Ruff | latest | Python linting + formatting |
| Vitest | 4.1.0 | Extension unit testing |
| Tailwind CSS | 4.2.2 | Utility CSS (minimal use in Phase 1) |
| @tailwindcss/vite | 4.2.2 | Vite plugin for Tailwind v4 |

### Installation Commands

**Extension:**
```bash
cd extension
pnpm create wxt@latest . --template react
pnpm add @supabase/supabase-js
pnpm add -D @wxt-dev/module-react typescript @types/react @types/react-dom
pnpm add -D @biomejs/biome vitest
pnpm add -D tailwindcss @tailwindcss/vite
```

**Backend:**
```bash
cd backend
uv init .
uv add fastapi "uvicorn[standard]" pydantic pyjwt httpx supabase openai
uv add --dev ruff pytest
```

**Supabase:**
```bash
# From project root
supabase init
supabase start  # Starts local Docker stack
```

## Architecture Patterns

### Recommended Project Structure (Phase 1)

```
bubb/
├── extension/                  # Chrome Extension (MV3)
│   ├── entrypoints/
│   │   ├── background.ts       # Service worker (auth, message routing)
│   │   ├── sidepanel/          # Side panel React app
│   │   │   ├── index.html
│   │   │   ├── main.tsx
│   │   │   └── App.tsx
│   │   ├── popup/              # Browser action popup (login prompt)
│   │   │   ├── index.html
│   │   │   ├── main.tsx
│   │   │   └── App.tsx
│   │   └── content.ts          # Content script (stub for Phase 1)
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client + custom storage adapter
│   │   ├── auth.ts             # Auth helper functions
│   │   ├── messaging.ts        # Typed message contracts
│   │   └── storage.ts          # chrome.storage wrapper utilities
│   ├── wxt.config.ts
│   ├── tsconfig.json
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app, CORS, middleware
│   │   ├── config.py           # Environment config (Pydantic Settings)
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── dependencies.py # JWT verification dependency
│   │   │   └── supabase.py     # Server-side Supabase client
│   │   └── routers/
│   │       ├── __init__.py
│   │       └── health.py       # Health check + auth-gated endpoint
│   ├── pyproject.toml
│   └── .python-version
├── supabase/
│   ├── config.toml
│   ├── seed.sql                # Test data (optional)
│   └── migrations/
│       ├── 00001_enable_extensions.sql
│       └── 00002_initial_schema.sql
├── .env.example
├── .gitignore
└── .planning/
```

### Pattern 1: WXT Entrypoint Convention
**What:** WXT uses file-based routing in `entrypoints/` directory. File names determine the manifest entry.
**When to use:** Always -- this is how WXT works.

```
entrypoints/
├── background.ts          -> manifest.background.service_worker
├── popup/index.html       -> manifest.action.default_popup
├── sidepanel/index.html   -> manifest.side_panel.default_path
└── content.ts             -> manifest.content_scripts[0]
```

WXT auto-generates manifest.json from these entrypoints. Configuration is inline:

```typescript
// entrypoints/background.ts
export default defineBackground({
  type: 'module',
  main() {
    // MUST be synchronous -- register all listeners here
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Handle messages
      return true; // Keep channel open for async
    });

    chrome.runtime.onInstalled.addListener(() => {
      console.log('Extension installed');
    });
  },
});
```

```typescript
// entrypoints/content.ts
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main(ctx) {
    // Content script stub for Phase 1
    console.log('bubb content script loaded');
  },
});
```

### Pattern 2: Custom chrome.storage.local Adapter for Supabase
**What:** Supabase's JS client needs a storage adapter interface (`getItem`, `setItem`, `removeItem`). In Chrome extensions, `localStorage` is unavailable in service workers. A custom adapter wrapping `chrome.storage.local` is required.
**When to use:** When initializing the Supabase client in any extension context.
**Confidence:** HIGH -- this pattern is widely used in the Chrome Extension + Supabase community.

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// In-memory cache to handle synchronous reads during initialization
const cache: Record<string, string> = {};

const chromeStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (key in cache) return cache[key];
    const result = await chrome.storage.local.get(key);
    const value = result[key] ?? null;
    if (value !== null) cache[key] = value;
    return value;
  },
  async setItem(key: string, value: string): Promise<void> {
    cache[key] = value;
    await chrome.storage.local.set({ [key]: value });
  },
  async removeItem(key: string): Promise<void> {
    delete cache[key];
    await chrome.storage.local.remove(key);
  },
};

export const supabase = createClient(
  import.meta.env.WXT_SUPABASE_URL,
  import.meta.env.WXT_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: chromeStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Not needed for extension auth
      flowType: 'implicit', // ID token flow, not PKCE
    },
  }
);
```

### Pattern 3: Google OAuth ID Token Flow in Chrome Extension
**What:** The auth flow uses Google's ID token flow via `chrome.identity.launchWebAuthFlow`, then exchanges the ID token with Supabase. This is NOT the PKCE code exchange -- it uses `response_type=id_token`.
**When to use:** For Chrome Extension auth with Supabase + Google OAuth.
**Source:** [Supabase Official Docs - Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

```typescript
// lib/auth.ts
import { supabase } from './supabase';

export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Generate nonce for security
    const nonce = btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
    );

    // 2. Hash nonce for Google (Google gets hashed, Supabase gets raw)
    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(nonce);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonce = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // 3. Build Google OAuth URL
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2?.client_id;
    if (!clientId) throw new Error('OAuth2 client_id not in manifest');

    const redirectUrl = chrome.identity.getRedirectURL();
    const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('redirect_uri', redirectUrl);
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('nonce', hashedNonce);

    // 4. Launch native auth flow
    const responseUrl = await new Promise<string>((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl.href, interactive: true },
        (redirectedTo) => {
          if (chrome.runtime.lastError || !redirectedTo) {
            reject(new Error(chrome.runtime.lastError?.message || 'Auth failed'));
          } else {
            resolve(redirectedTo);
          }
        }
      );
    });

    // 5. Extract ID token from redirect URL hash
    const url = new URL(responseUrl);
    const params = new URLSearchParams(url.hash.substring(1));
    const idToken = params.get('id_token');
    if (!idToken) throw new Error('No id_token in response');

    // 6. Exchange with Supabase (raw nonce, not hashed)
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      nonce: nonce,
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
```

### Pattern 4: FastAPI JWT Verification Dependency
**What:** FastAPI dependency that extracts and validates the Supabase JWT from the Authorization header. Uses PyJWT for local verification (no round-trip to Supabase Auth server).
**When to use:** On every authenticated endpoint.
**Source:** [Validating a Supabase JWT locally with Python and FastAPI](https://dev.to/zwx00/validating-a-supabase-jwt-locally-with-python-and-fastapi-59jf)

```python
# app/auth/dependencies.py
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.config import settings

security = HTTPBearer(auto_error=False)

async def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Extract and validate Supabase JWT. Returns decoded token payload."""
    if cred is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    try:
        payload = jwt.decode(
            cred.credentials,
            settings.supabase_jwt_secret,
            audience="authenticated",
            algorithms=["HS256"],
        )
        return payload  # Contains 'sub' (user_id), 'email', 'exp', etc.
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
```

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str
    openai_api_key: str  # bubb's hosted key (D-05)
    cors_origins: list[str] = ["chrome-extension://*"]

    model_config = {"env_file": ".env"}

settings = Settings()
```

### Pattern 5: Supabase Migration with RLS
**What:** Every table gets RLS enabled immediately after creation. Policies use `auth.uid()` to scope access.
**When to use:** Every migration. No exceptions (D-13).

```sql
-- supabase/migrations/00001_enable_extensions.sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- supabase/migrations/00002_initial_schema.sql

-- Notes table (D-09, D-12)
CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    highlighted_text TEXT NOT NULL,
    explanation TEXT,
    source_url TEXT NOT NULL,
    page_title TEXT,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    embedding vector(1536),  -- D-12: proactive for Agent Recall
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own notes"
    ON public.notes FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Topics table (D-10)
CREATE TABLE public.topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    note_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own topics"
    ON public.topics FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- User preferences table (D-11)
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_provider TEXT NOT NULL DEFAULT 'openai',
    daily_usage_count INTEGER NOT NULL DEFAULT 0,
    daily_usage_reset_at TIMESTAMPTZ,  -- Rolling 24-hour window (D-08)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own preferences"
    ON public.user_preferences FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Index for common queries
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_topic_id ON public.notes(topic_id);
CREATE INDEX idx_notes_source_url ON public.notes(user_id, source_url);
CREATE INDEX idx_topics_user_id ON public.topics(user_id);
```

**Note on table creation order:** `topics` must be created before `notes` because `notes.topic_id` references `topics.id`. The SQL above should be split or ordered accordingly in the actual migration.

### Anti-Patterns to Avoid
- **Storing auth tokens in service worker global variables:** Service workers restart frequently. Always use `chrome.storage.local` via the adapter.
- **Registering listeners asynchronously:** All `chrome.runtime.onMessage`, `chrome.runtime.onInstalled` listeners MUST be registered synchronously at the top level of `background.ts`'s `main()` function. Not inside `async` blocks or after `await` calls.
- **Using `localStorage` in service worker context:** It does not exist. Will throw. Use `chrome.storage.local`.
- **Hardcoding extension ID in redirect URL:** Use `chrome.identity.getRedirectURL()` dynamically.
- **Exposing `service_role` key in extension code:** Only the `anon` key goes to the extension. `service_role` stays in FastAPI's `.env`.
- **Using Supabase client for data queries from extension:** In bubb's architecture, all data operations go through FastAPI. Extension uses Supabase client ONLY for auth.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT verification | Custom token parser | PyJWT with `jwt.decode()` | Edge cases in JWT validation (clock skew, audience, algorithm confusion attacks) |
| OAuth flow | Custom HTTP calls to Google | `chrome.identity.launchWebAuthFlow` | Handles popup lifecycle, redirect interception, cookie management |
| Session persistence | Manual chrome.storage read/write for every auth check | Custom storage adapter + Supabase's built-in session management | Supabase handles refresh tokens, expiry, re-authentication automatically |
| Database migrations | Raw SQL scripts run manually | Supabase CLI migrations (`supabase migration new`, `supabase db reset`) | Version control, rollback, local/prod parity |
| CORS configuration | Per-route header setting | FastAPI `CORSMiddleware` | Handles preflight requests, credential headers, origin matching |
| Extension manifest | Hand-written manifest.json | WXT auto-generation from entrypoints | Less error-prone, stays in sync with actual entrypoints |

## Common Pitfalls

### Pitfall 1: Service Worker Loses Auth State on Restart
**What goes wrong:** Auth tokens stored in JavaScript variables disappear when Chrome terminates the service worker (after ~30s idle).
**Why it happens:** Developers treat MV3 service workers like persistent MV2 background pages.
**How to avoid:** All state in `chrome.storage.local` via the custom adapter. On every service worker wake, reconstruct state from storage. The Supabase client with the custom adapter handles this automatically.
**Warning signs:** Auth works after install but randomly fails. "Not authenticated" errors appear intermittently.

### Pitfall 2: OAuth Redirect URL Mismatch
**What goes wrong:** Google OAuth fails with `redirect_uri_mismatch` because the extension ID differs between dev (unpacked) and production (Chrome Web Store).
**Why it happens:** Extension IDs are generated from the extension's key. Unpacked extensions get a different ID each time unless pinned.
**How to avoid:** (1) Use `chrome.identity.getRedirectURL()` dynamically -- never hardcode. (2) Pin the extension ID during development by setting a consistent `key` field in manifest. (3) Register BOTH dev and prod redirect URLs in Google Cloud Console and Supabase dashboard.
**Warning signs:** Auth works locally but fails in packed builds. Auth flow opens but callback never fires.

### Pitfall 3: RLS Disabled on New Tables
**What goes wrong:** Tables created without `ENABLE ROW LEVEL SECURITY` expose all data via the Supabase anon key.
**Why it happens:** RLS is disabled by default on new PostgreSQL tables. Developers forget or disable it because empty results seem like a bug.
**How to avoid:** Every migration MUST have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` immediately after `CREATE TABLE`. Verify with: `SELECT tablename FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity;`
**Warning signs:** Queries return data without authentication. Data from other users visible.

### Pitfall 4: Async Listener Registration in Service Worker
**What goes wrong:** `chrome.runtime.onMessage` registered inside an async function. When Chrome wakes the service worker to dispatch an event, the listener doesn't exist yet and the message is silently dropped.
**Why it happens:** Developers put listener registration after async initialization (e.g., reading config from storage).
**How to avoid:** Register ALL event listeners synchronously at the top level of the `main()` function in `defineBackground`. Do async initialization inside handlers, not before.
**Warning signs:** Messages from content script or side panel randomly don't get responses. Works after fresh install, breaks later.

### Pitfall 5: CORS Rejection for Extension-to-Backend Requests
**What goes wrong:** FastAPI rejects requests from the extension because `chrome-extension://` origins are not whitelisted in CORS configuration.
**Why it happens:** Standard CORS examples use `http://localhost:*`. Chrome extension origins have the format `chrome-extension://<extension-id>`.
**How to avoid:** Configure `CORSMiddleware` with `allow_origins=["chrome-extension://*"]` or the specific extension ID. Also allow `Authorization` in `allow_headers`.
**Warning signs:** Network tab shows CORS preflight failures. API calls fail silently.

### Pitfall 6: Supabase Client Initialization Race in Service Worker
**What goes wrong:** The Supabase client tries to access `chrome.storage.local` before the storage adapter's cache is hydrated, causing null session reads.
**Why it happens:** The custom adapter's `getItem` returns null from the empty in-memory cache before the async `chrome.storage.local.get` completes.
**How to avoid:** Initialize the Supabase client lazily, or pre-hydrate the cache from `chrome.storage.local` before any auth operations. The adapter pattern shown above handles this by falling through to async storage when cache misses.
**Warning signs:** First auth check after service worker restart always returns "not authenticated", but second check works.

## Code Examples

### WXT Configuration (wxt.config.ts)

```typescript
// Source: WXT docs + sidepanel-extension-template
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'bubb',
    description: 'AI learning layer on top of the web',
    permissions: ['identity', 'storage', 'sidePanel', 'activeTab'],
    oauth2: {
      client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
      scopes: ['openid', 'email', 'profile'],
    },
    // Pin extension ID for consistent redirect URL in development
    // Generate with: chrome.runtime.id from an unpacked load
    // key: 'YOUR_EXTENSION_PUBLIC_KEY',
  },
});
```

### FastAPI App Skeleton (app/main.py)

```python
# Source: FastAPI docs
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import health

app = FastAPI(title="bubb API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # Includes Authorization header
)

app.include_router(health.router, prefix="/api", tags=["health"])
```

### Health Check Router with Auth (app/routers/health.py)

```python
from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user

router = APIRouter()

@router.get("/health")
async def health_check():
    """Public endpoint -- no auth required."""
    return {"status": "ok"}

@router.get("/health/auth")
async def auth_health_check(user: dict = Depends(get_current_user)):
    """Auth-gated endpoint -- proves JWT validation works."""
    return {
        "status": "ok",
        "user_id": user.get("sub"),
        "email": user.get("email"),
    }
```

### Environment Variables (.env.example)

```bash
# Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# AI (bubb-hosted)
OPENAI_API_KEY=sk-your-openai-api-key

# CORS
CORS_ORIGINS=["chrome-extension://your-extension-id"]

# Extension env vars (WXT uses import.meta.env)
# In extension/.env
WXT_SUPABASE_URL=http://127.0.0.1:54321
WXT_SUPABASE_ANON_KEY=your-anon-key
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PKCE code exchange in extension | ID token flow via `signInWithIdToken` | Supabase docs 2025 | Simpler -- no code_verifier storage issues in service workers |
| `localStorage` for Supabase session | Custom `chrome.storage.local` adapter | MV3 adoption (2023+) | Required because service workers lack localStorage |
| Implicit flow (`response_type=token`) | ID token flow (`response_type=id_token`) | Chrome third-party cookie changes | Implicit flow tokens in URL hash get stripped by `chrome.identity`; ID tokens in hash survive |
| python-jose for JWT | PyJWT | 2024+ | python-jose is less maintained; PyJWT is actively maintained with better typing |
| Manual manifest.json | WXT auto-generation | WXT 0.18+ (2024) | Less error-prone, automatic permissions from entrypoints |
| Supabase Pydantic v1 | Pydantic v2 | FastAPI 0.100+ (2023) | 2x faster serialization, required by modern FastAPI |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework (extension) | Vitest 4.1.0 |
| Framework (backend) | pytest (latest via uv) |
| Config file (extension) | None -- Wave 0 |
| Config file (backend) | None -- Wave 0 |
| Quick run (extension) | `pnpm vitest run --reporter=verbose` |
| Quick run (backend) | `uv run pytest -x -q` |
| Full suite | `pnpm vitest run && cd ../backend && uv run pytest` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Google OAuth sign-in completes and returns session | integration (manual trigger) | Manual -- requires browser interaction with Google popup | N/A (manual-only: OAuth popup cannot be automated in unit tests) |
| AUTH-02 | Session persists in chrome.storage.local and survives restart | unit | `pnpm vitest run tests/lib/storage-adapter.test.ts -x` | Wave 0 |
| AUTH-03 | RLS policies restrict data to authenticated user | integration | `uv run pytest tests/test_rls.py -x` | Wave 0 |
| AUTH-04 | FastAPI validates JWT and returns authenticated response | unit | `uv run pytest tests/test_auth.py -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `uv run pytest -x -q` (backend) or `pnpm vitest run` (extension)
- **Per wave merge:** Full suite across both projects
- **Phase gate:** Full suite green + manual OAuth flow test in unpacked extension

### Wave 0 Gaps
- [ ] `extension/vitest.config.ts` -- Vitest configuration for WXT project
- [ ] `extension/tests/lib/storage-adapter.test.ts` -- Tests custom chrome.storage adapter
- [ ] `backend/tests/conftest.py` -- Shared pytest fixtures (test client, mock JWT)
- [ ] `backend/tests/test_auth.py` -- JWT verification dependency tests
- [ ] `backend/tests/test_rls.py` -- Supabase RLS policy verification (requires local Supabase running)

## Open Questions

1. **Extension ID pinning for dev**
   - What we know: Unpacked extensions get random IDs. OAuth redirect URLs require a stable ID.
   - What's unclear: The exact `key` value needed for WXT's manifest config to pin the ID.
   - Recommendation: Generate a key during project setup by loading the unpacked extension once, copying the ID, then generating a key. Document the process.

2. **Supabase local dev Google OAuth**
   - What we know: Supabase CLI runs a local auth server on port 54321.
   - What's unclear: Whether local Supabase auth supports Google OAuth with `signInWithIdToken` without additional configuration.
   - Recommendation: During implementation, test against the local stack first. If Google OAuth requires Supabase hosted, use a dev project on supabase.com for auth testing while keeping the database local.

3. **30-day session expiry (D-03)**
   - What we know: Supabase's default JWT expiry is 1 hour (3600 seconds), with refresh tokens lasting longer.
   - What's unclear: Whether Supabase supports a 30-day refresh token window configuration, or if this needs custom logic.
   - Recommendation: Configure Supabase Auth settings: JWT expiry stays at 1 hour (auto-refreshed by the client), and set the `REFRESH_TOKEN_ROTATION_ENABLED` with appropriate session lifetime. The 30-day "session" is really a refresh token lifetime.

## Sources

### Primary (HIGH confidence)
- [Supabase - Login with Google (Chrome Extension section)](https://supabase.com/docs/guides/auth/social-login/auth-google) -- ID token flow, nonce handling, manifest config
- [WXT Entrypoints Documentation](https://wxt.dev/guide/essentials/entrypoints.html) -- File conventions, background/sidepanel/content script setup
- [WXT Installation Guide](https://wxt.dev/guide/installation.html) -- Project scaffolding with React template
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) -- Policy syntax, auth.uid()
- [Supabase pgvector Documentation](https://supabase.com/docs/guides/database/extensions/pgvector) -- Enabling vector extension, column types
- [Supabase Local Development CLI](https://supabase.com/docs/guides/local-development) -- supabase init, start, migrations
- [FastAPI OAuth2 JWT Tutorial](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/) -- JWT verification pattern
- [Supabase signInWithIdToken API Reference](https://supabase.com/docs/reference/javascript/auth-signinwithidtoken)

### Secondary (MEDIUM confidence)
- [Validating a Supabase JWT locally with FastAPI](https://dev.to/zwx00/validating-a-supabase-jwt-locally-with-python-and-fastapi-59jf) -- PyJWT + FastAPI dependency pattern
- [Supabase Auth in Chrome Extension (Medium, Feb 2026)](https://chethiyakd.medium.com/supabase-auth-in-a-chrome-extension-what-you-wont-find-in-the-docs-a2ae6691cca3) -- chrome.storage adapter gotchas, PKCE verifier loss
- [Side Panel Extension Template (WXT + React)](https://github.com/evanlong-me/sidepanel-extension-template) -- Project structure reference
- [WXT + React + shadcn + Tailwind template](https://github.com/imtiger/wxt-react-shadcn-tailwindcss-chrome-extension) -- Integration patterns
- [Supabase Auth in Chrome Extensions (pustelto.com)](https://pustelto.com/blog/supabase-auth/) -- Session persistence patterns
- [Integrating FastAPI with Supabase Auth](https://dev.to/j0/integrating-fastapi-with-supabase-auth-780) -- Server-side Supabase client setup

### Tertiary (LOW confidence)
- Custom chrome.storage.local adapter exact implementation -- assembled from multiple community sources, not from a single authoritative reference. Needs validation during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm/PyPI registries on 2026-03-21
- Architecture: HIGH -- patterns confirmed by official WXT docs, Supabase docs, and FastAPI docs
- Auth flow: HIGH -- Supabase official docs explicitly document Chrome Extension ID token flow
- Pitfalls: HIGH -- documented in project's own PITFALLS.md research with multiple source verification
- Custom storage adapter: MEDIUM -- pattern is well-established in community but no single canonical implementation exists

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days -- stable technologies, unlikely to change)
