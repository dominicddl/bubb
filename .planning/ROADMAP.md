# Roadmap: bubb

## Overview

bubb delivers a Chrome Extension that turns passive web reading into active, cumulative learning. The roadmap moves from infrastructure (auth, database, extension scaffold) through the core highlight-to-explain interaction, layered AI features, a full knowledge browsing side panel, and finally Agent Recall -- the differentiator that surfaces prior learning in topic views. Each phase delivers a coherent, testable capability that the next phase builds on.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation and Auth** - Extension scaffold, Google OAuth, Supabase schema with RLS, FastAPI skeleton
- [ ] **Phase 2: Core Interaction** - Highlight text on any page, get contextual AI explanation in Shadow DOM popup, auto-save as note
- [ ] **Phase 3: AI Depth and Follow-ups** - Layered explanation depth, follow-up questions, streaming and token management
- [ ] **Phase 4: Knowledge Base and Side Panel** - Side panel with This Page and Continue Learning views, AI topic suggestion, search
- [ ] **Phase 5: Agent Recall** - Previously learned concept chips displayed in topic detail view

## Phase Details

### Phase 1: Foundation and Auth
**Goal**: Users can sign in with Google and have a working cloud-synced account, with the full infrastructure (extension, backend, database) operational and secure
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can sign in to the extension with their Google account in one click
  2. User can close and reopen the browser and remain signed in without re-authenticating
  3. Extension connects to FastAPI backend with a valid JWT and receives an authenticated response
  4. Supabase database has RLS enabled on all tables so users can only access their own data
  5. AI API keys are stored server-side only and never exposed to the extension
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Scaffold monorepo: WXT extension + FastAPI backend + Supabase schema with RLS
- [ ] 01-02-PLAN.md — Backend JWT verification, health endpoints, and test suite
- [ ] 01-03-PLAN.md — Extension-side Google OAuth flow, session persistence, and auth UI

### Phase 2: Core Interaction
**Goal**: Users can highlight text on any webpage and instantly receive a contextual AI explanation that is automatically saved as a note
**Depends on**: Phase 1
**Requirements**: CORE-01, CORE-02, CORE-05, KB-01, KB-02
**Success Criteria** (what must be TRUE):
  1. User can select/highlight text on any webpage and a popup appears with an AI explanation relevant to the surrounding page content
  2. The popup renders correctly inside a Shadow DOM without CSS leaking to or from the host page
  3. Every explanation is automatically saved as a note with the source URL and page title
  4. User can dismiss or undo an auto-saved note from the popup
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: AI Depth and Follow-ups
**Goal**: Users can explore explanations at multiple depth levels and ask follow-up questions, all streamed in real time with managed token costs
**Depends on**: Phase 2
**Requirements**: CORE-03, CORE-04
**Success Criteria** (what must be TRUE):
  1. User can click a depth toggle to switch between simple, intermediate, and technical explanations for the same highlighted text
  2. User can type a follow-up question in the popup and receive a response that maintains conversational context from the current explanation
  3. AI responses stream into the popup token-by-token without being cut off mid-response
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Knowledge Base and Side Panel
**Goal**: Users can browse, organize, and search their accumulated notes through a side panel with AI-powered topic organization
**Depends on**: Phase 3
**Requirements**: KB-03, KB-04, KB-05, KB-06, PANEL-01, PANEL-02, PANEL-03, PANEL-04, PANEL-05
**Success Criteria** (what must be TRUE):
  1. User can open the side panel via the extension icon and see two views: "This Page" (notes from current URL) and "Continue Learning" (all topics)
  2. "This Page" view shows notes from the current page with term, explanation, and timestamp
  3. "Continue Learning" view shows all topics with note counts, and clicking a topic shows all notes under it with source URLs
  4. When a note is saved, the AI suggests a topic label that the user can accept, edit, or skip with one click -- and the AI reuses existing topics when a match exists
  5. User can search across all saved notes and find results by keyword
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Agent Recall
**Goal**: Users can see their previously learned concepts surfaced as contextual chips in topic detail views, making their accumulated knowledge visible
**Depends on**: Phase 4
**Requirements**: RECALL-01
**Success Criteria** (what must be TRUE):
  1. When viewing a topic detail page, the user sees an Agent Recall banner showing previously learned concept chips related to that topic
  2. Concept chips reflect actual notes the user has saved, not generic suggestions
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Auth | 0/3 | Not started | - |
| 2. Core Interaction | 0/3 | Not started | - |
| 3. AI Depth and Follow-ups | 0/2 | Not started | - |
| 4. Knowledge Base and Side Panel | 0/3 | Not started | - |
| 5. Agent Recall | 0/1 | Not started | - |
