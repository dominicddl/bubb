# bubb

## What This Is

bubb is a Chrome Extension that acts as a persistent AI learning layer on top of the web. It lets students instantly understand anything they read — without leaving the page — by highlighting text to get contextual, layered AI explanations. Every explanation is automatically saved as a note and organized by AI-suggested topics, building a personal knowledge base that follows the user across websites and learning sessions.

## Core Value

When a student highlights text on any webpage, they get an instant, contextual AI explanation that builds on what they've already learned — turning passive reading into active, cumulative learning.

## Requirements

### Validated

- [x] Google OAuth sign-in — Validated in Phase 1: Foundation and Auth
- [x] Cloud sync — notes and topics persist across devices — Validated in Phase 1: Foundation and Auth (infrastructure: Supabase schema with RLS)

### Active

- [ ] User can highlight text on any webpage to trigger an AI explanation popup
- [ ] AI explanations are contextual — adapted to surrounding page content, not generic definitions
- [ ] User can drill deeper into explanations (layered depth: simple → intermediate → technical)
- [ ] User can ask specific follow-up questions about highlighted text in the same popup
- [ ] Every explanation is auto-saved as a note (smart auto-save)
- [ ] AI suggests a short noun-phrase topic label for each note (e.g., "Transformer Architecture")
- [ ] AI reuses existing topics from the user's history when a match exists
- [ ] User can accept, edit, or skip the suggested topic with one click
- [ ] Side panel accessible via extension icon with two views
- [ ] Side panel "This Page" view shows notes from the current page (term, explanation, timestamp)
- [ ] Side panel "Continue Learning" view shows all topics with note counts
- [ ] Topic detail view shows all notes under a topic with source URLs
- [ ] Agent Recall — when viewing a topic, shows previously learned concepts as chips
- [ ] Agent Recall context is used to enrich new explanations (builds on prior learning)
- [ ] Search bar in side panel to find saved concepts
- [ ] User can choose between OpenAI or Anthropic as their AI provider (user provides API key)

### Out of Scope

- Email/password auth — Google OAuth is sufficient for v1
- Mobile app — Chrome Extension only for v1
- Social features (sharing notes, collaborative learning) — solo learning first
- Offline mode — cloud-first for v1
- Browser extensions for Firefox/Safari — Chrome only for v1
- Spaced repetition / flashcards — knowledge base is for reference, not quizzing

## Context

- **Target users:** Students reading academic material, research papers, technical docs, and articles online
- **Core interaction:** Highlight text → popup with contextual explanation → auto-save as note → organized by topic
- **Key differentiator:** Agent Recall — bubb remembers what you've learned and connects past knowledge to current reading sessions. It feels like a memory, not a notebook.
- **Topic system:** AI suggests short noun-phrase labels, promotes grouping by reusing existing topics. Users can accept/edit/skip with minimal friction.
- **Side panel design:** Two-view architecture — "This Page" (chronological notes from current URL) and "Continue Learning" (topic-based organization with drill-in). Topic view shows Agent Recall chips + notes with source URLs.

## Constraints

- **Tech stack**: Chrome Extension (Manifest V3) + Supabase (auth, database) + FastAPI (backend API)
- **AI providers**: OpenAI and Anthropic APIs — user provides their own API key
- **Auth**: Google OAuth via Supabase Auth
- **Storage**: Supabase Postgres for cloud sync (notes, topics, user preferences)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multi-provider AI (OpenAI + Anthropic) | Flexibility for users, no vendor lock-in | — Pending |
| Supabase + FastAPI backend | Supabase handles auth/storage, FastAPI handles AI proxy and business logic | — Pending |
| Smart auto-save (not manual save) | Low friction — knowledge base builds passively | — Pending |
| AI-suggested topics (not manual tagging) | Automatic structure without user effort | — Pending |
| Google OAuth only | Fast onboarding for students, sufficient for v1 | Validated (Phase 1) |
| Tab-based OAuth (not launchWebAuthFlow) | Avoids "browser not secure" warning in Chrome popup | Validated (Phase 1) |
| Supabase native signInWithIdToken | Real refresh tokens, automatic session management | Validated (Phase 1) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 after Phase 1 completion*
