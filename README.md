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
