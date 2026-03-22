---
phase: 01-foundation-and-auth
plan: 01
subsystem: infra
tags: [wxt, react, tailwind, shadcn, vitest, fastapi, supabase, pydantic, postgres, rls]

# Dependency graph
requires: []
provides:
  - WXT Chrome Extension scaffold with React 19, Tailwind CSS v4, shadcn/ui components
  - FastAPI backend skeleton with CORS, health endpoint, Pydantic Settings config
  - Supabase database schema: notes, topics, user_preferences tables with RLS
  - Vitest configured for extension tests under extension/tests/
  - All extension entrypoints: background.ts, content.ts, sidepanel/, popup/
  - Monorepo structure with /extension (pnpm) and /backend (uv) directories
affects: [02-google-oauth-auth-flow, 03-extension-side-google-oauth-auth-ui, auth, database]

# Tech tracking
tech-stack:
  added:
    - WXT 0.20.20 (Chrome Extension MV3 build framework)
    - React 19.2.4 (UI rendering)
    - Tailwind CSS 4.2.2 (utility CSS, CSS-based config)
    - shadcn/ui components (Button, Card, Alert, Badge, Separator - manually initialized for WXT)
    - @supabase/supabase-js 2.99.3 (extension-side client)
    - lucide-react (icons)
    - class-variance-authority, clsx, tailwind-merge (shadcn utilities)
    - @radix-ui/react-slot, @radix-ui/react-separator (Radix primitives)
    - Vitest 4.1.0 (extension unit testing)
    - FastAPI 0.135.1 (backend API)
    - pydantic-settings 2.13.1 (env config)
    - pyjwt 2.12.1 (JWT validation)
    - supabase Python 2.28.3 (server-side client)
    - openai Python 2.29.0 (AI client)
    - uvicorn 0.42.0 (ASGI server)
    - uv (Python package manager)
    - Supabase CLI 2.75.0 (local dev + migrations)
  patterns:
    - WXT entrypoint convention: files under extension/entrypoints/ auto-generate manifest entries
    - Background service worker uses synchronous listener registration at top level (MV3 requirement)
    - Tailwind v4 uses CSS @import instead of tailwind.config.js
    - shadcn manually initialized for WXT (CLI unsupported); components.json written manually
    - Pydantic Settings reads from .env file for all backend configuration
    - RLS policies use auth.uid() to scope all table access to the authenticated user

key-files:
  created:
    - extension/wxt.config.ts
    - extension/entrypoints/background.ts
    - extension/entrypoints/content.ts
    - extension/entrypoints/sidepanel/App.tsx
    - extension/entrypoints/popup/App.tsx
    - extension/app.css
    - extension/components.json
    - extension/vitest.config.ts
    - extension/lib/utils.ts
    - extension/components/ui/button.tsx
    - extension/components/ui/card.tsx
    - extension/components/ui/alert.tsx
    - extension/components/ui/badge.tsx
    - extension/components/ui/separator.tsx
    - backend/app/main.py
    - backend/app/config.py
    - supabase/migrations/00001_enable_extensions.sql
    - supabase/migrations/00002_initial_schema.sql
    - .env.example
  modified: []

key-decisions:
  - "shadcn init via CLI fails for WXT projects (unsupported framework) — initialized manually by writing components.json and CSS variables"
  - "pyproject.toml requires-python changed from >=3.13 to >=3.12 to match .python-version constraint"
  - "Tailwind v4 CSS-based config: @import tailwindcss in app.css, no tailwind.config.js needed"
  - "WXT CLI scaffold (npx wxt init) requires interactive input — extension files created manually instead"

patterns-established:
  - "WXT entrypoint pattern: export default defineBackground/defineContentScript/defineConfig from entrypoint files"
  - "Background listener registration: all chrome.runtime listeners registered synchronously in main() — never inside async blocks"
  - "Tailwind + shadcn in WXT: app.css uses @import tailwindcss; CSS variables defined with @layer base for shadcn theme"
  - "Backend config pattern: Pydantic BaseSettings in app/config.py, single settings instance imported across app"

requirements-completed: [AUTH-03, AUTH-04]

# Metrics
duration: 9min
completed: 2026-03-21
---

# Phase 01 Plan 01: Monorepo Scaffold — Extension, FastAPI Backend, Supabase Schema Summary

**WXT Chrome Extension scaffold (React 19, Tailwind v4, shadcn/ui), FastAPI backend with CORS + health endpoint, and Supabase Postgres schema (notes/topics/user_preferences) with RLS enabled on all tables**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-03-21T14:26:15Z
- **Completed:** 2026-03-21T14:34:57Z
- **Tasks:** 2
- **Files modified:** 24 created

## Accomplishments

- Extension builds successfully with `pnpm wxt build` (204–212 KB output, 0 errors)
- FastAPI app imports and responds: `from app.main import app; print(app.title)` → "bubb API"
- Database schema: 3 tables (notes, topics, user_preferences) with RLS on all tables, embedding vector(1536) on notes for future Agent Recall
- Vitest configured and ready for test files under extension/tests/

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold extension with WXT + React + Tailwind + shadcn + Vitest** - `32d4d83` (feat)
2. **Task 2: Scaffold backend + Supabase + database migrations with RLS** - `bd03a36` (feat)

## Files Created/Modified

- `extension/wxt.config.ts` - WXT config with React module, Tailwind plugin, manifest (sidePanel, identity, storage permissions)
- `extension/entrypoints/background.ts` - Service worker stub with synchronous message listener registration
- `extension/entrypoints/content.ts` - Content script stub matching all URLs
- `extension/entrypoints/sidepanel/App.tsx` - Side panel placeholder React component
- `extension/entrypoints/popup/App.tsx` - Popup placeholder React component
- `extension/app.css` - Tailwind v4 import + shadcn CSS variables
- `extension/components.json` - shadcn configuration (new-york style, neutral base, Tailwind v4)
- `extension/vitest.config.ts` - Vitest config targeting tests/**/*.test.ts, node environment
- `extension/lib/utils.ts` - shadcn cn() utility (clsx + tailwind-merge)
- `extension/components/ui/` - Button, Card, Alert, Badge, Separator shadcn components
- `backend/app/main.py` - FastAPI app with CORS middleware and /api/health endpoint
- `backend/app/config.py` - Pydantic BaseSettings with supabase_url, supabase_jwt_secret, openai_api_key, cors_origins
- `backend/app/auth/__init__.py` - Empty module placeholder
- `backend/app/routers/__init__.py` - Empty module placeholder
- `supabase/migrations/00001_enable_extensions.sql` - Enable uuid-ossp and vector extensions
- `supabase/migrations/00002_initial_schema.sql` - Full schema with RLS policies and indexes
- `.env.example` - All environment variables documented

## Decisions Made

- **WXT CLI non-interactive**: `npx wxt init` requires interactive prompts; created all extension files manually instead. No functional difference.
- **shadcn manual init**: `npx shadcn init` doesn't recognize WXT as a supported framework. Wrote components.json manually and installed shadcn components by copying source (standard shadcn approach). Works identically.
- **pyproject.toml Python version fix**: uv init defaulted to `>=3.13` but `.python-version` pins 3.12. Updated `requires-python = ">=3.12"` to resolve incompatibility.
- **Tailwind v4 config**: No tailwind.config.js needed — v4 uses CSS @import and the Vite plugin handles everything.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] pyproject.toml Python version incompatibility**
- **Found during:** Task 2 (backend verification)
- **Issue:** uv init wrote `requires-python = ">=3.13"` but `.python-version` pins 3.12. `uv run python` failed with version incompatibility error.
- **Fix:** Changed `requires-python = ">=3.12"` in pyproject.toml
- **Files modified:** backend/pyproject.toml
- **Verification:** `uv run python -c "from app.main import app; print(app.title)"` prints "bubb API"
- **Committed in:** bd03a36 (Task 2 commit)

**2. [Rule 3 - Blocking] WXT CLI requires interactive input — manual scaffold instead**
- **Found during:** Task 1 (extension scaffold)
- **Issue:** `pnpm create wxt@latest` fails (package not on npm). `npx wxt init` requires interactive terminal prompts that cannot be automated.
- **Fix:** Created all extension files manually following WXT conventions. Result is identical to CLI output.
- **Files modified:** All extension/ files
- **Verification:** `pnpm wxt build` exits 0 with clean output
- **Committed in:** 32d4d83 (Task 1 commit)

**3. [Rule 3 - Blocking] shadcn CLI doesn't support WXT — manual component init**
- **Found during:** Task 1 (shadcn initialization)
- **Issue:** `npx shadcn@latest init --defaults` errors with "could not detect a supported framework".
- **Fix:** Wrote components.json manually, added CSS variables to app.css, installed Radix UI primitives, copied shadcn component source for Button, Card, Alert, Badge, Separator.
- **Files modified:** extension/components.json, extension/app.css, extension/components/ui/
- **Verification:** `pnpm wxt build` exits 0; components compile without errors
- **Committed in:** 32d4d83 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes necessary for correct operation. No scope creep. All acceptance criteria met.

## Issues Encountered

None beyond the deviations documented above.

## Known Stubs

The following files are intentional placeholder stubs for this scaffold plan. They will be wired with real implementations in later plans:

- `extension/entrypoints/sidepanel/App.tsx` - Placeholder heading only; real auth UI built in Plan 01-03
- `extension/entrypoints/popup/App.tsx` - Placeholder heading only; real popup built in Plan 01-03
- `extension/entrypoints/content.ts` - Empty content script; highlight detection built in Phase 2
- `extension/entrypoints/background.ts` - Stub message listener; auth and AI routing built in Plans 01-02/01-03

These stubs are intentional and expected — this plan's goal is infrastructure scaffolding, not UI implementation.

## User Setup Required

None for this plan. No external services need configuration to build the extension or import the FastAPI app.

To run the full stack locally (required for later plans):
1. Copy `.env.example` to `.env` and fill in Supabase keys after `supabase start`
2. Start Docker, then run `supabase start` from project root
3. Run backend: `cd backend && uv run uvicorn app.main:app --reload`

## Next Phase Readiness

- Plan 01-02 (Google OAuth auth flow) can begin immediately — background.ts stub is ready for auth logic
- Plan 01-03 (Extension auth UI) can begin immediately — shadcn components are installed and ready
- Supabase migrations are ready to apply once Docker is available (`supabase start && supabase db push`)

## Self-Check: PASSED

All files created and both task commits verified:
- `32d4d83` — feat(01-01): scaffold extension with WXT + React + Tailwind + shadcn + Vitest
- `bd03a36` — feat(01-01): scaffold backend + Supabase + database migrations with RLS
- All 10 key files confirmed present on disk

---
*Phase: 01-foundation-and-auth*
*Completed: 2026-03-21*
