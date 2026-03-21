# Requirements: bubb

**Defined:** 2026-03-21
**Core Value:** When a student highlights text on any webpage, they get an instant, contextual AI explanation that builds on what they've already learned — turning passive reading into active, cumulative learning.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Infrastructure

- [ ] **AUTH-01**: User can sign in with Google OAuth (one-click)
- [ ] **AUTH-02**: User session persists across browser restarts
- [ ] **AUTH-03**: User data syncs across devices via cloud storage
- [ ] **AUTH-04**: AI explanations are powered by hosted API (bubb-managed, no user API key required)

### Core Interaction

- [ ] **CORE-01**: User can highlight text on any webpage to trigger an explanation popup
- [ ] **CORE-02**: AI explanation is contextual — adapted to surrounding page content, not a generic definition
- [ ] **CORE-03**: User can ask follow-up questions about highlighted text in the same popup
- [ ] **CORE-04**: User can drill deeper into explanations (simple → intermediate → technical)
- [ ] **CORE-05**: Source URL and page title are stored with every note

### Knowledge Base

- [ ] **KB-01**: Every explanation is auto-saved as a note (smart auto-save)
- [ ] **KB-02**: User can dismiss/undo an auto-saved note
- [ ] **KB-03**: AI suggests a short noun-phrase topic label for each note
- [ ] **KB-04**: AI reuses existing topics from user's history when a match exists
- [ ] **KB-05**: User can accept, edit, or skip the suggested topic with one click
- [ ] **KB-06**: User can search across all saved notes (full-text search)

### Side Panel

- [ ] **PANEL-01**: Side panel accessible via extension icon
- [ ] **PANEL-02**: "This Page" view shows notes from current URL (term, explanation, timestamp)
- [ ] **PANEL-03**: "Continue Learning" view shows all topics with note counts
- [ ] **PANEL-04**: Topic detail view shows all notes under a topic with source URLs
- [ ] **PANEL-05**: Total saved notes count displayed in panel header

### Agent Recall

- [ ] **RECALL-01**: Topic detail view shows previously learned concept chips (Agent Recall banner)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Agent Recall Enrichment

- **RECALL-02**: Agent Recall context is injected into new AI explanations (builds on prior learning)
- **RECALL-03**: Explanations adapt based on user's demonstrated knowledge level in a topic

### Extended Features

- **EXT-01**: User can configure keyboard shortcut to trigger explanation
- **EXT-02**: User can choose between OpenAI or Anthropic as AI provider (BYOK)
- **EXT-03**: PDF support — highlight and explain text in browser PDF viewer
- **EXT-04**: Semantic search across saved notes (embedding-based)
- **EXT-05**: Export notes as Markdown or JSON
- **EXT-06**: User can edit or delete saved notes
- **EXT-07**: First-run onboarding tutorial

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Email/password auth | Google OAuth sufficient for v1 |
| Mobile app | Chrome Extension only for v1 |
| Social features (sharing, collaboration) | Solo learning first — enormous complexity |
| Offline mode | Cloud-first; AI explanations require network |
| Firefox/Safari extensions | Chrome only for v1 |
| Spaced repetition / flashcards | bubb is a knowledge base, not a quiz app |
| Full-page summarization | Commodity feature — doesn't build knowledge base |
| YouTube video support | High complexity, different content type |
| Browser-wide annotation layer | bubb is explanation-first, not annotation-first |
| Custom AI model selection beyond v2 BYOK | Two providers covers majority of users |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| CORE-01 | Phase 2 | Pending |
| CORE-02 | Phase 2 | Pending |
| CORE-03 | Phase 3 | Pending |
| CORE-04 | Phase 3 | Pending |
| CORE-05 | Phase 2 | Pending |
| KB-01 | Phase 2 | Pending |
| KB-02 | Phase 2 | Pending |
| KB-03 | Phase 4 | Pending |
| KB-04 | Phase 4 | Pending |
| KB-05 | Phase 4 | Pending |
| KB-06 | Phase 4 | Pending |
| PANEL-01 | Phase 4 | Pending |
| PANEL-02 | Phase 4 | Pending |
| PANEL-03 | Phase 4 | Pending |
| PANEL-04 | Phase 4 | Pending |
| PANEL-05 | Phase 4 | Pending |
| RECALL-01 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after roadmap creation*
