<!-- GSD:project-start source:PROJECT.md -->
## Project

**bubb**

bubb is a Chrome Extension that acts as a persistent AI learning layer on top of the web. It lets students instantly understand anything they read — without leaving the page — by highlighting text to get contextual, layered AI explanations. Every explanation is automatically saved as a note and organized by AI-suggested topics, building a personal knowledge base that follows the user across websites and learning sessions.

**Core Value:** When a student highlights text on any webpage, they get an instant, contextual AI explanation that builds on what they've already learned — turning passive reading into active, cumulative learning.

### Constraints

- **Tech stack**: Chrome Extension (Manifest V3) + Supabase (auth, database) + FastAPI (backend API)
- **AI providers**: OpenAI and Anthropic APIs — user provides their own API key
- **Auth**: Google OAuth via Supabase Auth
- **Storage**: Supabase Postgres for cloud sync (notes, topics, user preferences)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Extension Framework
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| WXT | ^0.20.18 | Extension build framework (Manifest V3) | The leading Chrome Extension framework in 2025-2026. Built on Vite for fast HMR. Auto-generates manifest from file structure. First-class support for content scripts, side panels, background workers, and popups. Framework-agnostic (React module available). Produces ~43% smaller bundles than Plasmo. Actively maintained with frequent releases. |
| React | ^19.2 | UI rendering (side panel + content script overlays) | Standard UI library. WXT has an official `@wxt-dev/module-react` for seamless integration. React 19's improved SSR and concurrent features are overkill here, but the ecosystem maturity, component libraries, and hiring/learning resources make it the clear pick. |
| TypeScript | ^5.7 | Type safety across all extension contexts | Non-negotiable for a multi-context extension (content script, background, side panel). Catches message-passing type mismatches at compile time. WXT has built-in TypeScript support. |
### Styling & UI Components
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tailwind CSS | ^4.2 | Utility-first CSS | v4 is 5x faster builds via Rust-based Oxide engine. Config lives in CSS (`@theme`) instead of JS. Works well inside Shadow DOM for content script isolation. |
| shadcn/ui | CLI v4 | Pre-built accessible React components | Not a dependency -- copies component source into your project. Built on Radix UI primitives. Fully customizable. Perfect for side panel UI (buttons, dialogs, search bars, cards). Pairs natively with Tailwind CSS v4. |
### Backend
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| FastAPI | ^0.135 | Backend API server | Async-native Python web framework. Automatic OpenAPI docs. Pydantic v2 integration gives 2x JSON serialization performance. Ideal for AI proxy endpoints that need streaming (SSE support). Type-safe request/response models. |
| Pydantic | ^2.7 | Data validation & serialization | Required by FastAPI. v2 rewrote core in Rust for major performance gains. Model-based validation for AI request/response schemas. |
| Python | 3.12+ | Runtime | 3.12 is the sweet spot -- stable, fast, good library support. 3.13 is fine too. |
| uvicorn | latest | ASGI server | Standard production server for FastAPI. Use with `--workers` for multi-process in production. |
### Auth & Database
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase (hosted) | — | Auth + Postgres database + Realtime | Managed Postgres with built-in auth, Row Level Security, and REST/GraphQL APIs. Free tier is generous for MVP. Google OAuth is a first-class provider with specific Chrome Extension support (Authorized Client IDs for extensions). |
| @supabase/supabase-js | ^2.99 | JavaScript client (extension-side) | Isomorphic JS client. Works in service workers and content scripts. Handles auth session management, token refresh, and database queries. |
| supabase (Python) | latest | Python client (backend-side) | For server-side operations that need service role access (bypassing RLS for admin operations). |
### AI Integration
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| openai (Python SDK) | ^2.29 | OpenAI API client | Official SDK. Supports streaming, function calling, structured outputs. Well-typed with Pydantic models. |
| anthropic (Python SDK) | ^0.86 | Anthropic API client | Official SDK. Supports streaming, tool use. Consistent API design with OpenAI SDK patterns. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | ^5.0 | Client-side state management | Managing shared state across side panel views (notes, topics, search). Lightweight (1.1KB). Works in Chrome Extension multi-context architecture with `zustand-chrome-storage` middleware for syncing state across popup/background/content script contexts. |
| @tanstack/react-query | ^5 | Server state management | Caching Supabase queries, background refetching, optimistic updates for note saving. Separates server state from UI state cleanly. |
| zustand-chrome-storage | latest | Zustand middleware for chrome.storage | Persists Zustand stores to `chrome.storage.local` or `chrome.storage.sync`. Needed because extension contexts don't share memory. |
| lucide-react | latest | Icons | Consistent, tree-shakable icon set. Works with shadcn/ui out of the box. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| WXT CLI (`npx wxt@latest init`) | Project scaffolding | Interactive CLI generates project with React + TypeScript template. Creates entrypoints for all extension contexts. |
| WXT dev mode (`wxt dev`) | Development server | Hot module replacement for all extension contexts including background service workers. Auto-reloads extension on file changes. |
| Biome | Linting + formatting | Faster than ESLint + Prettier combo. Single tool. Configure once. Opinionated defaults are good. |
| Vitest | Unit/integration testing | Vite-native test runner. Fast. Compatible with WXT's Vite-based build. |
| uv | Python package manager | 10-100x faster than pip. Lockfile support. Use instead of pip/poetry for the FastAPI backend. |
| Ruff | Python linting + formatting | Rust-based. Replaces flake8 + black + isort. Single config file. |
## Installation
### Extension (frontend)
# Scaffold project
# Core
# UI
# Dev dependencies
### Backend (Python)
# Initialize project
# Core
# Dev
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| WXT | Plasmo | Never for new projects in 2026. Plasmo's maintenance has stalled, uses Parcel (slower), and produces larger bundles. Community is migrating away. |
| WXT | Raw Vite + manual manifest | Only if WXT's abstractions conflict with a very unusual extension architecture. For bubb's standard content-script + side-panel + background pattern, WXT saves significant boilerplate. |
| React | Svelte / Vue | If the team already knows Svelte/Vue. React's ecosystem (shadcn/ui, Zustand, React Query) is unmatched for this type of UI-heavy extension. |
| Zustand | Redux Toolkit | If you need Redux DevTools time-travel debugging or have a very large, deeply nested state tree. Zustand is simpler, smaller, and sufficient for bubb's state needs. |
| Zustand | Jotai | If your state is highly atomic (many independent pieces). Zustand's store-based model fits bubb better (notes, topics, and preferences are related state slices). |
| shadcn/ui | Chakra UI / MUI | If you want fully pre-styled components with less customization. shadcn/ui gives more control and smaller bundles since you only copy what you use. |
| FastAPI | Express/Node.js | If you want a single language (JS/TS) across frontend and backend. FastAPI is better here because Python has superior AI/ML library support (OpenAI/Anthropic SDKs, langchain if needed later). |
| Supabase | Firebase | If you need Firestore's document model or Firebase's ML Kit. Supabase gives you real Postgres (SQL, joins, RLS) which is better for relational data like notes-topics-users. |
| uv | pip / poetry | Only if uv causes compatibility issues with a specific package. This is rare. uv is strictly better for speed and reproducibility. |
| Biome | ESLint + Prettier | If you need ESLint plugins not yet supported by Biome (e.g., very specific React rules). Biome covers 95%+ of common rules and is much faster. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Plasmo | Maintenance concerns, Parcel bundler is slower, larger output, community migrating to WXT | WXT |
| CRXJS | Abandoned -- last meaningful update was 2023. Does not support latest Vite versions. | WXT |
| Manifest V2 | Deprecated by Chrome. Will stop working in production extensions. All new extensions must use V3. | Manifest V3 (WXT handles this automatically) |
| Webpack | Slower builds, worse DX, more config overhead compared to Vite. No reason to use for new projects. | Vite (via WXT) |
| `chrome.storage.sync` for large data | 100KB total limit, 8KB per item. Notes will exceed this quickly. | Supabase Postgres for data, `chrome.storage.local` only for session/preferences cache |
| LiteLLM / LangChain for AI proxy | Over-engineered for bubb's needs (two providers, simple chat completions). Adds dependency complexity and abstraction layers. | Direct OpenAI + Anthropic SDK usage with a thin adapter pattern in FastAPI |
| Redux | Excessive boilerplate for an extension's state needs. Actions, reducers, middleware -- all unnecessary complexity. | Zustand |
| CSS Modules / Styled Components in content scripts | No built-in Shadow DOM isolation. Styles will leak into and from the host page. | Tailwind CSS inside Shadow DOM (WXT's `createShadowRootUi` handles this) |
| `localStorage` / `sessionStorage` in extension | Not available in service workers (background script). Not synced across extension contexts. | `chrome.storage.local` via Zustand middleware, or Supabase for persistent data |
## Stack Patterns by Variant
- Use WXT's `createShadowRootUi` to mount React inside Shadow DOM
- Tailwind CSS with `cssInjectionMode: "ui"` so styles auto-inject into shadow root
- Keep this component tree minimal -- only the explanation popup and highlight controls
- Communicate with background script via `chrome.runtime.sendMessage` for AI requests
- Full React app with shadcn/ui components, Zustand stores, React Query
- This is a regular web page context -- no Shadow DOM needed
- Mount React normally via WXT's sidepanel entrypoint
- Use Supabase client directly for auth and data queries
- No UI. Handles message routing, AI API calls (via FastAPI), session management
- Use WXT's background entrypoint with `type: 'module'`
- Keep Supabase auth session here and broadcast to other contexts
- Handle `chrome.identity.launchWebAuthFlow` for Google OAuth
- Thin proxy pattern: receive request, validate, forward to OpenAI/Anthropic, stream response back
- Use SSE (Server-Sent Events) for streaming AI responses to the extension
- Pydantic models for request/response schemas
- Supabase service role client for any server-side data operations
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| WXT ^0.20 | React 19, Vite 6, TypeScript 5.7 | WXT uses Vite 6 internally. React 19 works via `@wxt-dev/module-react`. |
| Tailwind CSS ^4.2 | Vite 6 (via `@tailwindcss/vite` plugin) | v4 requires the Vite plugin, not the PostCSS approach from v3. |
| shadcn/ui CLI v4 | Tailwind CSS v4, React 19 | CLI v4 explicitly supports Tailwind v4 config format. |
| @supabase/supabase-js ^2.99 | Chrome MV3 service workers | Works in service worker context. Use `createClient` with custom storage adapter for `chrome.storage.local`. |
| FastAPI ^0.135 | Pydantic ^2.7, Python 3.12+ | FastAPI dropped Pydantic v1 support. Always use Pydantic v2. |
| Zustand ^5.0 | React 19 | v5 dropped default exports, uses named exports. Compatible with React 19 concurrent features. |
| @tanstack/react-query ^5 | React 19, Zustand 5 | Works alongside Zustand. Use React Query for server state, Zustand for client state. |
## Chrome Extension Auth Flow (Supabase + Google OAuth)
## Sources
- [WXT Official Site](https://wxt.dev/) -- Framework features, content script UI docs, side panel support
- [WXT npm](https://www.npmjs.com/package/wxt) -- Version 0.20.18 confirmed
- [WXT Content Script UI Docs](https://wxt.dev/guide/essentials/content-scripts) -- Shadow DOM integration patterns
- [2025 State of Browser Extension Frameworks](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/) -- WXT vs Plasmo vs CRXJS comparison
- [Chrome Extension Framework Comparison 2025](https://www.devkit.best/blog/mdx/chrome-extension-framework-comparison-2025) -- Bundle size and DX comparison
- [Supabase Google OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google) -- Chrome Extension auth setup
- [Supabase Auth in Chrome Extensions](https://pustelto.com/blog/supabase-auth/) -- Implementation patterns
- [Supabase OAuth in Chrome Extensions](https://beastx.ro/supabase-login-with-oauth-in-chrome-extensions) -- launchWebAuthFlow approach
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) -- Version 2.99.3 confirmed
- [FastAPI Release Notes](https://fastapi.tiangolo.com/release-notes/) -- Version and Pydantic v2 compatibility
- [OpenAI Python SDK Releases](https://github.com/openai/openai-python/releases) -- Version 2.29.0 confirmed
- [Anthropic Python SDK](https://github.com/anthropics/anthropic-sdk-python) -- Version 0.86.0 confirmed
- [React npm](https://www.npmjs.com/package/react) -- Version 19.2.4 confirmed
- [Zustand npm](https://www.npmjs.com/package/zustand) -- Version 5.0.12 confirmed
- [Zustand Chrome Storage](https://github.com/brokeboiflex/zustand-chrome-storage) -- Chrome Extension middleware
- [Zustand + Chrome Storage pattern](https://www.drewalth.com/lab/zustand-chrome-storage/) -- Multi-context state sync
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) -- Oxide engine, CSS-based config
- [shadcn/ui CLI v4 Changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) -- Latest CLI version
- [WXT + React + shadcn + Tailwind template](https://github.com/imtiger/wxt-react-shadcn-tailwindcss-chrome-extension) -- Community template
- [Side Panel Extension Template (WXT)](https://github.com/evanlong-me/sidepanel-extension-template) -- WXT + Tailwind + shadcn/ui side panel
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
