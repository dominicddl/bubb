# bubb

A Chrome Extension that acts as a persistent AI learning layer on top of the web. Highlight text on any page to get instant, contextual AI explanations that build on what you already know.

## Project Structure

```
bubb/
  extension/    # Chrome Extension (WXT + React 19 + Tailwind v4)
  backend/      # FastAPI server (AI proxy + API)
  supabase/     # Database schema, migrations, RLS policies
```

## Quick Start

### Prerequisites

- Node.js 22+ and pnpm
- Python 3.12+ and uv
- Supabase CLI (for local dev)

### Setup

```bash
# Install all dependencies
pnpm install

# Extension
cd extension
cp .env.example .env    # Fill in Supabase credentials
wxt                     # Start dev server

# Backend
cd backend
cp .env.example .env    # Fill in Supabase + API keys
uv run uvicorn app.main:app --reload

# Supabase (local)
supabase start
```

### Load the Extension

1. Run `cd extension && wxt` to build
2. Open `chrome://extensions` with Developer Mode on
3. Click "Load unpacked" and select `extension/.output/chrome-mv3`

## Tech Stack

| Layer | Tech |
|-------|------|
| Extension | WXT, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | FastAPI, Pydantic v2, Python 3.12 |
| Database | Supabase (Postgres + Auth + RLS) |
| AI | OpenAI + Anthropic SDKs (user-provided keys) |

## Auth Flow

Google OAuth via Supabase Auth with `signInWithIdToken`. The extension opens a Chrome tab for Google sign-in, captures the ID token from the redirect, and creates a native Supabase session with refresh tokens.

## Developer Workflows

### Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable code. All PRs target this branch. |
| `staging` | Mirrors production. Merging `main` → `staging` triggers a Render deploy. |
| Feature branches | Use `dom/<feature-name>` prefix. Branch off `main`. |

**Flow:** feature branch → PR to `main` → merge → merge `main` into `staging` → auto-deploy.

### Local Development

**Extension:**
```bash
cd extension
cp .env.example .env       # Local Supabase + backend URLs
wxt                         # Dev server with HMR (NOT `wxt dev`)
```

**Backend:**
```bash
cd backend
cp .env.example .env       # Supabase + OpenAI/Anthropic keys
uv run uvicorn app.main:app --reload
```

**Supabase:**
```bash
supabase start             # Local Postgres, Auth, Studio
supabase db reset           # Reset and re-run all migrations
```

### Testing

```bash
# Backend unit tests
cd backend
uv run pytest

# Backend with coverage
uv run pytest --cov=app

# Extension type checking
cd extension
pnpm tsc --noEmit
```

### Building for Production

```bash
cd extension
wxt build                   # Uses .env.production for WXT_ vars
```

The production build reads from `extension/.env.production` (not committed — contains production Supabase URL and Render backend URL). Output goes to `extension/.output/chrome-mv3`.

### Deployment

- **Backend (Render):** Merging into `staging` triggers the CD workflow (`.github/workflows/cd.yml`), which deploys to Render via deploy hook.
- **Keep-alive:** A GitHub Actions cron job (`.github/workflows/keep-alive.yml`) pings the health endpoint every 14 minutes to prevent Render free tier from sleeping.
- **Extension:** Built locally with `wxt build`, then uploaded to Chrome Web Store manually.
- **Database:** Run `supabase db push --linked` to push new migrations to production.

### PR Conventions

- Branch prefix: `feature/<description>`
- Keep commits focused — separate logical changes into separate commits
- Don't commit `.env.production`, spec docs, or planning artifacts
