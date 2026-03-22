# Feature Research

**Domain:** AI-powered browser learning extension (highlight-to-explain with personal knowledge base)
**Researched:** 2026-03-21
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Highlight-to-popup interaction | Core UX paradigm established by Google Dictionary, Liner, Readwise. Users expect text selection to trigger immediate inline action. | MEDIUM | Must handle edge cases: iframes, shadow DOM, dynamic content, contenteditable fields. Positioning logic near screen edges is tricky. |
| Contextual definitions/explanations | Every competitor does this. Explainpaper, Liner, and Readwise Ghostreader all provide context-aware answers, not just dictionary lookups. Generic definitions feel broken. | MEDIUM | Requires sending surrounding page context to LLM. Token budget management matters. |
| Follow-up questions in popup | Readwise Ghostreader, Liner AI Copilot, and Explainpaper all let users ask follow-ups. A one-shot explanation with no ability to dig deeper feels like a dead end. | MEDIUM | Needs conversational state within the popup. Keep context window manageable. |
| Save/bookmark explanations | Liner saves highlights, Glasp saves to knowledge base, Readwise syncs to note apps. Users expect to retrieve what they learned later. | LOW | bubb's auto-save approach is even lower friction than manual save buttons. |
| Side panel / dashboard for saved content | Liner has folders, Glasp has a profile page, Recall has a knowledge graph view. Users need a way to browse what they have collected. | MEDIUM | Chrome side panel API (Manifest V3) is the right surface. Two-view architecture (This Page + Continue Learning) is well-scoped. |
| Search across saved content | Recall, Readwise, and Glasp all offer search. Without it, a growing knowledge base becomes unusable. | MEDIUM | Full-text search is minimum. Semantic search is a differentiator (defer to v1.x). |
| User authentication and cloud sync | Liner, Readwise, Recall all sync across devices. Students use multiple machines (laptop, library computer, etc.). Data loss is unacceptable. | MEDIUM | Google OAuth + Supabase is the right call. Keep auth flow minimal -- one-click Google sign-in. |
| Source URL attribution | Glasp, Hypothes.is, and Readwise all track where highlights came from. Students need to cite sources and revisit original pages. | LOW | Store URL + page title + timestamp with every note. |
| Works on common content types | Liner works on web pages, PDFs, and YouTube. At minimum, standard web pages must work flawlessly. PDF and YouTube are expected by power users but can be v1.x. | LOW (web), HIGH (PDF/video) | v1: web pages only. Explicitly defer PDF and video to post-validation. |
| Keyboard shortcut / quick trigger | Google Dictionary uses double-click. Liner uses keyboard shortcuts. Power users expect a fast trigger, not just mouse selection. | LOW | Default shortcut + customizable binding. Manifest V3 commands API handles this. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Agent Recall (cumulative learning context) | **bubb's core differentiator.** No competitor builds on what you previously learned. Readwise has "chat with highlights" but it is reactive search, not proactive enrichment. Recall (getrecall.ai) resurfaces links while browsing but does not weave prior knowledge into new explanations. bubb actively injects your learning history into every new explanation. | HIGH | Requires efficient retrieval of relevant prior notes per topic. Embedding-based similarity or topic-graph lookup. Must not bloat LLM context -- selective recall is key. |
| AI-suggested topic labels with reuse | Glasp uses manual folders. Liner uses manual folders. Hypothes.is uses manual tags. Auto-categorization that also reuses existing topics means structure builds itself with zero user effort. This is a genuine UX innovation in this space. | MEDIUM | Need a topic matching/similarity step before creating new topics. Use existing topic list as few-shot examples in LLM prompt. |
| Layered explanation depth (simple to technical) | Explainpaper gives one explanation level. Google Dictionary gives one definition. Liner gives one summary. bubb's "drill deeper" model (simple -> intermediate -> technical) matches how students actually learn: start broad, go deep on demand. | LOW | Three-tier prompt templating. Each tier adds more technical detail. Store which depth level the user reached per note. |
| Smart auto-save (no save button) | Every competitor requires explicit save/highlight/bookmark action. Auto-saving every explanation removes friction entirely. The knowledge base builds passively as you learn. | LOW | Every explanation response triggers a write. Need good UX for "undo" or "don't save this one" to avoid clutter. |
| Per-page learning context ("This Page" view) | No competitor shows a page-scoped view of everything you have learned on the current URL. Readwise is document-level but inside their reader app, not overlaid on the original page. This is valuable for students reading long articles or documentation. | LOW | Filter notes by current URL. Simple but surprisingly absent from competitors. |
| Personalized explanation style | Recall and Liner treat all users the same. bubb could adapt explanation complexity based on the user's demonstrated knowledge level within a topic (inferred from Agent Recall depth). A student who has 15 notes on "neural networks" gets different explanations than a first-timer. | HIGH | Defer to v2. Requires enough data per topic to infer proficiency. Cool but premature for v1. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Spaced repetition / flashcard generation | Wisdolia/Jungle AI does this. Anki integration is popular. Students think they want quizzes. | Massively increases scope. Flashcard quality requires different AI prompting. Mixes "reference knowledge base" with "active study tool" -- two different products. Wisdolia pivoted to this as their entire product. | bubb is a knowledge base, not a quiz app. The "Continue Learning" view with Agent Recall serves review without the flashcard overhead. Revisit only if users explicitly request it post-launch. |
| Social/collaborative features | Hypothes.is and Glasp are social-first. Sharing highlights feels like a natural extension. | Social features require moderation, privacy controls, public profiles, and feed algorithms. Enormous complexity for a solo-learning tool. Glasp's social layer is their differentiator, not bubb's. | Keep bubb private-first. If sharing is needed later, start with simple export (copy note as text, share URL). |
| Full-page summarization | Liner, Recall, and Readwise all offer "summarize this page." Seems like an obvious addition. | Summarization is a commodity feature -- ChatGPT, Perplexity, and every AI extension does it. It does not align with bubb's core value of understanding specific concepts in context. Adds token cost without building the knowledge base. | Stay focused on selection-based explanations. If users want page summaries, they already have 50 extensions for that. |
| PDF and video support in v1 | Liner and Glasp support PDFs and YouTube. Users will ask for it. | PDF rendering in extensions is complex (pdf.js integration, content script injection into Chrome's PDF viewer). YouTube requires transcript extraction and timestamp mapping. Both are high-effort features that distract from nailing the core web page experience. | Explicitly v1.x. Web pages first. Add PDF support as the first post-validation feature since students read many PDFs. |
| Offline mode | Seems important for students on unreliable wifi. | Requires local LLM or cached responses, IndexedDB sync logic, conflict resolution. Enormous complexity for marginal benefit since LLM explanations inherently require network. | Cloud-first. Cache previously viewed notes locally for read-only access, but do not attempt offline explanation generation. |
| Custom AI model selection beyond OpenAI/Anthropic | Power users want to use Llama, Gemini, local models, etc. | Each provider has different API formats, token limits, and capabilities. Supporting N providers is an ongoing maintenance burden. Two providers (OpenAI + Anthropic) covers the vast majority of users. | Stick with OpenAI + Anthropic for v1. If demand is strong, add Gemini as a third option in v1.x. Do not build a generic "any model" interface. |
| Browser-wide always-on annotation layer | Hypothes.is shows persistent highlights on every revisited page. Visually marks up the web. | Requires storing highlight positions (DOM anchors), handling page layout changes, and re-rendering highlights on page load. Fragile and high-maintenance. Conflicts with many websites' styling. | bubb is explanation-first, not annotation-first. Notes live in the side panel, not painted on the page. If users want to see "what I learned on this page," the side panel This Page view handles it. |

## Feature Dependencies

```
[Google OAuth + Cloud Sync]
    |
    v
[Highlight-to-popup interaction]
    |
    +---> [Contextual AI explanations]
    |         |
    |         +---> [Follow-up questions in popup]
    |         |
    |         +---> [Layered depth (simple -> technical)]
    |         |
    |         +---> [Smart auto-save]
    |                   |
    |                   +---> [AI-suggested topic labels]
    |                   |         |
    |                   |         +---> [Topic reuse from history]
    |                   |
    |                   +---> [Side panel: This Page view]
    |                   |
    |                   +---> [Side panel: Continue Learning view]
    |                             |
    |                             +---> [Search across notes]
    |                             |
    |                             +---> [Agent Recall]
    |                                       |
    |                                       +---> [Agent Recall enriches new explanations]
```

### Dependency Notes

- **Auth + Sync must come first:** Every feature that persists data depends on having a user account and cloud storage. Build this in phase 1.
- **Highlight interaction is the foundation:** Everything flows from the ability to select text and trigger a popup. This is the single most critical piece to get right.
- **Auto-save requires explanations to exist:** Cannot save what has not been generated. Auto-save is a thin layer on top of the explanation pipeline.
- **Topic labels require saved notes:** AI topic suggestion runs after a note is created.
- **Topic reuse requires topic history:** Cannot match against existing topics until the user has some. This feature improves over time (cold start problem is real but acceptable).
- **Agent Recall requires a populated knowledge base:** Recall is only valuable once the user has enough notes in a topic. This means it should be built after the core save/organize pipeline works, but does not need to wait for hundreds of notes -- even 2-3 prior notes in a topic add value.
- **Search becomes critical at scale:** Not urgent for the first 20 notes, essential once a user has 100+. Can ship after core features but before public launch.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what is needed to validate the core value proposition.

- [ ] Highlight-to-popup with contextual AI explanation -- this IS the product
- [ ] Follow-up questions in the same popup -- without this, users hit a wall
- [ ] Layered depth (simple/intermediate/technical) -- key differentiator, low cost to implement
- [ ] Smart auto-save of every explanation -- knowledge base must build passively
- [ ] AI-suggested topic labels with accept/edit/skip -- automatic organization is core
- [ ] Topic reuse from user history -- prevents topic sprawl from day one
- [ ] Side panel with This Page and Continue Learning views -- users need to see their knowledge
- [ ] Basic search across saved notes -- full-text, not semantic
- [ ] Agent Recall chips in topic view -- shows what the user has learned before
- [ ] Agent Recall context injected into new explanations -- the key differentiator
- [ ] Google OAuth sign-in -- one-click onboarding
- [ ] Cloud sync via Supabase -- notes persist across sessions and devices
- [ ] OpenAI and Anthropic provider selection with user API key -- flexibility without vendor lock-in

### Add After Validation (v1.x)

Features to add once core is working and users confirm the value.

- [ ] PDF support -- add when students report wanting to use bubb on research papers
- [ ] Semantic search -- add when users report difficulty finding notes with keyword search
- [ ] Export notes (Markdown, JSON) -- add when users ask to use notes outside bubb
- [ ] Note editing and deletion -- add when users report wanting to clean up their knowledge base
- [ ] Keyboard shortcut customization -- add when power users request faster workflows
- [ ] Onboarding tutorial / first-run experience -- add when new user activation rates are low

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Personalized explanation style based on inferred proficiency -- requires significant user data
- [ ] YouTube video support with timestamp-linked explanations -- high complexity, different content type
- [ ] Cross-topic knowledge graph visualization -- compelling but high engineering cost
- [ ] Gemini / third AI provider support -- only if user demand is clear
- [ ] Import from Readwise / Glasp / other tools -- only matters at scale for user acquisition

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Highlight-to-popup | HIGH | MEDIUM | P1 |
| Contextual AI explanations | HIGH | MEDIUM | P1 |
| Follow-up questions | HIGH | MEDIUM | P1 |
| Layered depth | MEDIUM | LOW | P1 |
| Smart auto-save | HIGH | LOW | P1 |
| AI topic labels + reuse | HIGH | MEDIUM | P1 |
| Side panel (both views) | HIGH | MEDIUM | P1 |
| Agent Recall (display) | MEDIUM | LOW | P1 |
| Agent Recall (enrichment) | HIGH | HIGH | P1 |
| Basic search | MEDIUM | LOW | P1 |
| Google OAuth + sync | HIGH | MEDIUM | P1 |
| API key management (OpenAI + Anthropic) | MEDIUM | LOW | P1 |
| PDF support | MEDIUM | HIGH | P2 |
| Semantic search | MEDIUM | MEDIUM | P2 |
| Export notes | LOW | LOW | P2 |
| Note editing/deletion | LOW | LOW | P2 |
| Personalized explanations | MEDIUM | HIGH | P3 |
| Knowledge graph visualization | LOW | HIGH | P3 |
| YouTube support | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Google Dictionary | Liner | Readwise Reader | Glasp | Hypothes.is | Recall (getrecall.ai) | Explainpaper | bubb (planned) |
|---------|------------------|-------|-----------------|-------|-------------|----------------------|--------------|----------------|
| Inline popup on selection | Double-click word only | Yes (AI copilot) | Inside Reader app only | Highlight only, no explanation | Annotation sidebar | No (saves pages) | Highlight text in uploaded PDFs | Yes -- highlight any text on any page |
| AI explanations | Dictionary definition only | Generic AI answers | Ghostreader (define, simplify, ask) | No AI explanation | No AI | AI summaries | Contextual to paper | Contextual to page + learning history |
| Follow-up questions | No | Yes (chat) | Yes (ask document) | No | No | Yes (chat with KB) | Yes | Yes (in popup) |
| Layered depth | No | No | No | No | No | No | No | Yes (simple -> intermediate -> technical) |
| Auto-save | No | Manual highlight | Manual highlight | Manual highlight | Manual annotation | Auto on page save | Manual upload | Auto on every explanation |
| AI-organized topics | No | Manual folders | Manual tags | Manual tags | Manual tags | Auto-linked graph | No | AI-suggested labels with reuse |
| Cumulative learning context | No | No | Chat with all highlights (reactive) | No | No | Resurfaces links (passive) | No | Agent Recall (proactive enrichment) |
| Knowledge base | Word history export | Highlight folders | Highlight library | Profile page + export | Annotation groups | Knowledge graph | No | Topic-organized notes with source URLs |
| Cloud sync | No | Yes (account) | Yes (account) | Yes (account) | Yes (account) | Yes (account) | No | Yes (Supabase) |
| Pricing model | Free | Freemium ($8/mo) | $8/mo subscription | Free (social) | Free (personal) | Freemium ($7/mo) | Free (limited) | BYOK (user provides API key) |

### Key Competitive Insights

1. **No competitor does cumulative learning.** Readwise's "chat with highlights" is the closest, but it is pull-based (you ask it) rather than push-based (it enriches automatically). Recall resurfaces related content while browsing, but does not inject prior knowledge into new explanations. Agent Recall is genuinely novel.

2. **Auto-organization is rare.** Most tools dump everything into manual folders or tags. Recall's auto-linked knowledge graph is the closest competitor, but it organizes by page/source, not by conceptual topic. bubb's AI topic suggestion with reuse is a meaningfully different approach.

3. **Layered depth does not exist in competitors.** Every tool gives one level of explanation. The drill-deeper model is simple to implement but absent from the market.

4. **BYOK pricing is uncommon but smart for v1.** Most competitors charge $7-8/month. BYOK avoids the need for bubb to subsidize API costs during validation. This is a feature for early adopters who already have API keys, not a mass-market pricing strategy. Plan for a hosted tier eventually.

5. **The highlight-to-explain interaction on live web pages is underserved.** Google Dictionary does words only. Liner does generic AI chat. Readwise only works inside their reader app. Explainpaper only works on uploaded PDFs. bubb working on any web page with contextual explanations fills a real gap.

## Sources

- [Readwise AI features (Ghostreader)](https://learningaloud.com/blog/2025/02/12/ai-in-readwise/)
- [Readwise Reader changelog](https://readwise.io/changelog)
- [Liner Chrome Web Store](https://chromewebstore.google.com/detail/liner-chatgpt-ai-copilot/bmhcbmnbenmcecpmpepghooflbehcack)
- [Glasp features](https://glasp.live/features)
- [Glasp homepage](https://glasp.co/)
- [Hypothes.is Chrome Web Store](https://chromewebstore.google.com/detail/hypothesis-web-pdf-annota/bjfhmglciegochdpefhhlphglcehbmek)
- [Recall (getrecall.ai)](https://www.getrecall.ai/)
- [Recall Chrome Web Store](https://chromewebstore.google.com/detail/recall-summarize-anything/ldbooahljamnocpaahaidnmlgfklbben)
- [Explainpaper](https://www.explainpaper.com/)
- [Scholarcy features](https://www.scholarcy.com/features/ai-research-paper)
- [Wisdolia / Jungle AI](https://aicenter.ai/products/wisdolia)
- [Google Dictionary Chrome Web Store](https://chromewebstore.google.com/detail/google-dictionary-by-goog/mgijmajocgfcbeboacabfgobmjgjcoja)

---
*Feature research for: AI-powered browser learning extension*
*Researched: 2026-03-21*
