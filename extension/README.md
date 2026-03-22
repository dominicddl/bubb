# bubb Extension

Chrome Extension built with WXT (Manifest V3), React 19, Tailwind CSS v4, and shadcn/ui.

## Setup

```bash
pnpm install
cp .env.example .env   # Add WXT_SUPABASE_URL and WXT_SUPABASE_ANON_KEY
wxt                    # Dev server with HMR
wxt build              # Production build
```

## Architecture

| Context | Location | Purpose |
|---------|----------|---------|
| Side Panel | `entrypoints/sidepanel/` | Main UI — dashboard, notes, topics |
| Popup | `entrypoints/popup/` | Quick actions when clicking the toolbar icon |
| Background | `entrypoints/background.ts` | Auth handling, message routing, API calls |
| Content Script | `entrypoints/content.ts` | Text selection detection on web pages |

## Key Modules

- `lib/auth.ts` — Google OAuth sign-in/sign-out via Supabase
- `lib/supabase.ts` — Lazy-initialized Supabase client with chrome.storage adapter
- `lib/messaging.ts` — Typed message passing between extension contexts
- `lib/storage.ts` — chrome.storage.local adapter for Supabase session persistence
- `components/BubbLogo.tsx` — SVG mascot component

## Design System

Three-accent color palette defined in `app.css`:
- **Green** (`--accent-green`) — Learning/explain features
- **Coral** (`--accent-coral`) — CTAs and actions
- **Gold** (`--accent-gold`) — Notes and secondary highlights

Typography: DM Sans (body), JetBrains Mono (bracket labels).

## Testing

```bash
pnpm test              # Run Vitest
```
