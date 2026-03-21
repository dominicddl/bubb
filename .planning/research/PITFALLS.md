# Pitfalls Research

**Domain:** Chrome Extension AI Learning Tool (Manifest V3 + Supabase + FastAPI + LLM APIs)
**Researched:** 2026-03-21
**Confidence:** HIGH (multiple official sources + community post-mortems)

## Critical Pitfalls

### Pitfall 1: Service Worker Termination Kills LLM Streaming Mid-Response

**What goes wrong:**
Manifest V3 service workers terminate after 30 seconds of inactivity. If the extension routes LLM API calls through the service worker (background script), a streaming response that takes longer than 30 seconds gets killed mid-stream. The user sees a partial explanation that cuts off abruptly with no error message.

**Why it happens:**
Developers treat the MV3 service worker like the old MV2 persistent background page. They put API call logic in the service worker because it seems like the natural "backend" of an extension. But the service worker lifecycle is fundamentally different -- it is ephemeral and will be terminated.

**How to avoid:**
- Do NOT route LLM streaming through the service worker. Make API calls directly from the content script or side panel (which have persistent lifetimes while visible).
- If the service worker must be involved, use an offscreen document (Chrome 114+) that pings the service worker every 25 seconds to reset the idle timer.
- For long-running streams, use the side panel as the streaming consumer -- it stays alive as long as it is visible.
- As of Chrome 116, active WebSocket connections extend service worker lifetimes, but SSE (EventSource) does NOT get this treatment.

**Warning signs:**
- LLM explanations work for short responses but randomly cut off for longer ones.
- "Service worker terminated" errors in chrome://extensions.
- Users report that explanations "disappear" or stop mid-sentence.

**Phase to address:**
Phase 1 (Foundation) -- architecture must route streaming correctly from day one. Retrofitting this is a rewrite.

---

### Pitfall 2: Supabase RLS Disabled or Misconfigured, Exposing All User Data

**What goes wrong:**
New Supabase tables have RLS disabled by default. If you create tables through SQL migrations and forget to enable RLS, every row is publicly accessible through the Supabase API using just the anon key (which is embedded in the extension and visible to anyone). In January 2025, 170+ apps were found with exposed databases (CVE-2025-48757) from this exact mistake. 83% of Supabase data leaks involve RLS misconfigurations.

**Why it happens:**
Supabase makes it easy to start building without thinking about security. The anon key works immediately, queries return data, and everything seems fine. Developers add RLS "later" and forget. Additionally, enabling RLS without adding policies silently returns empty results -- no error, just no data -- which leads developers to disable RLS "to fix the bug."

**How to avoid:**
- Add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` to every single migration file immediately after CREATE TABLE. No exceptions.
- Write RLS policies that use `auth.uid()` to scope all reads/writes to the authenticated user: `USING (user_id = auth.uid())`.
- Never use `user_metadata` claims in RLS policies -- users can modify their own metadata.
- Never expose the `service_role` key in the extension or frontend. It bypasses all RLS.
- Use Supabase's Database Advisor (built-in lint) to catch tables with RLS disabled.

**Warning signs:**
- You can query data without being logged in using just the anon key.
- Queries return data belonging to other users.
- Tables exist without corresponding RLS policies in migrations.

**Phase to address:**
Phase 1 (Foundation) -- RLS must be enforced from the first table creation. Bolting on security later means auditing every query path.

---

### Pitfall 3: Google OAuth Redirect URL Mismatch in Chrome Extension

**What goes wrong:**
Google OAuth in Chrome extensions requires a specific redirect URL format (`https://<extension-id>.chromiumapp.org/`) that must be registered in three places: Google Cloud Console, Supabase Auth redirect URLs, and called via `chrome.identity.launchWebAuthFlow()`. Getting any one of these wrong produces cryptic auth failures. Worse, the extension ID changes between unpacked development builds and the published Chrome Web Store version, breaking auth across environments.

**Why it happens:**
OAuth redirect flows were designed for web apps with stable URLs, not browser extensions with generated IDs. The documentation for wiring Supabase Auth + Google OAuth + Chrome Extension together is scattered across three different docs sites. Developers configure it for dev, it works, then it breaks in production because the extension ID changed.

**How to avoid:**
- Use `chrome.identity.getRedirectURL()` to dynamically get the redirect URL -- never hardcode it.
- Register both your development extension ID and production extension ID redirect URLs in Supabase and Google Cloud Console.
- Pin your extension ID during development using a consistent `key` field in manifest.json.
- Test the full OAuth flow in a packed extension, not just unpacked.
- Use `chrome.identity.launchWebAuthFlow()` with the Supabase OAuth URL, then extract the tokens from the redirect.

**Warning signs:**
- OAuth works locally but fails after publishing.
- "redirect_uri_mismatch" errors from Google.
- Auth flow opens but the redirect callback never fires.

**Phase to address:**
Phase 1 (Foundation/Auth) -- auth is the first user-facing flow and blocks everything else.

---

### Pitfall 4: Extension CSS Leaks Into Host Pages (and Vice Versa)

**What goes wrong:**
Content scripts inject UI elements (the explanation popup) directly into the host page's DOM. The host page's CSS styles bleed into your popup, making it look broken -- wrong fonts, wrong colors, broken layout. Conversely, your extension's CSS can break the host page's layout. This varies per website, making it nearly impossible to test exhaustively.

**Why it happens:**
Content scripts share the page's DOM. Any CSS rules with broad selectors (like `*`, `div`, `p`, `a`) will affect both the page and the extension's injected elements. Developers test on a few sites and it looks fine, then users report it looks broken on Gmail, Google Docs, or sites with aggressive CSS resets.

**How to avoid:**
- Use Shadow DOM for all injected UI. Shadow DOM provides true CSS isolation -- page styles cannot penetrate in, extension styles cannot leak out.
- Use a library like Emotion with CacheProvider configured to inject styles inside the Shadow DOM root.
- Never inject `<style>` tags into the page's `<head>`.
- Test on CSS-aggressive sites: Gmail, Google Docs, GitHub, Twitter/X, Medium, Reddit.

**Warning signs:**
- Popup looks different on different websites.
- Users report "broken" or "ugly" popup on specific sites.
- Your extension's font changes depending on the page.

**Phase to address:**
Phase 2 (Core Interaction) -- when building the highlight-to-explain popup. Must be Shadow DOM from the start; retrofitting is painful.

---

### Pitfall 5: User API Keys Stored Insecurely in chrome.storage

**What goes wrong:**
The user provides their OpenAI/Anthropic API key. Storing it in `chrome.storage.local` means any other extension with the right permissions, or malware, can read it. In June 2025, a widely-publicized vulnerability report showed popular Chrome extensions leaking API keys, secrets, and tokens from `chrome.storage`.

**Why it happens:**
`chrome.storage.local` is the obvious and documented way to persist data in extensions. It works. Developers do not realize it offers no encryption at rest and is accessible to any code running in the extension's context (including compromised dependencies).

**How to avoid:**
- Route all LLM API calls through your FastAPI backend. The user's API key should be stored server-side in Supabase (encrypted at rest), never used directly from the extension.
- If you must store the key client-side (e.g., for direct API calls), encrypt it with AES-GCM using a key derived from the user's auth session before writing to `chrome.storage`.
- Never log API keys. Never include them in error reports.
- Implement key rotation reminders for users.

**Warning signs:**
- API keys visible in chrome.storage via DevTools.
- API keys sent over unencrypted channels or logged in console.
- No encryption layer between user input and storage.

**Phase to address:**
Phase 1 (Foundation) -- the key storage architecture must be decided before building the AI integration. Changing this later means migrating stored keys.

---

### Pitfall 6: Service Worker Loses State on Restart

**What goes wrong:**
The service worker stores state in JavaScript variables (e.g., user session data, pending requests, cached context). When Chrome terminates and restarts the service worker (which happens frequently and unpredictably), all in-memory state is lost. Pending operations vanish. The extension silently enters a broken state.

**Why it happens:**
MV2 background pages were persistent -- global variables survived for the entire browser session. Developers carry this mental model into MV3 and store state in module-level variables. Chrome's service worker lifecycle documentation exists but is easy to miss.

**How to avoid:**
- Treat the service worker as stateless. Every time it wakes up, it should reconstruct state from `chrome.storage`.
- Use `chrome.storage.session` (Chrome 112+) for ephemeral session data that persists across service worker restarts but clears when the browser closes.
- Register all event listeners synchronously at the top level of the service worker script -- async registration causes missed events after restart.
- Never use `setTimeout`/`setInterval` in the service worker; use `chrome.alarms` API instead.

**Warning signs:**
- Features work immediately after extension install but randomly break later.
- "Listener not registered" or "port disconnected" errors.
- Extension requires disabling and re-enabling to fix.

**Phase to address:**
Phase 1 (Foundation) -- the service worker architecture sets the pattern for all background logic.

---

### Pitfall 7: Unbounded LLM Token Costs from Uncapped Context Windows

**What goes wrong:**
The extension sends the entire page content plus conversation history as context to the LLM. On long pages (research papers, documentation), this can mean 50K+ tokens per request. With Agent Recall sending previous learning context, token counts compound. A single user's session can cost dollars, not cents.

**Why it happens:**
Developers focus on explanation quality -- more context means better explanations. They test with short pages and small histories. In production, users highlight text on massive pages while having hundreds of saved notes, and costs explode.

**How to avoid:**
- Extract only the relevant surrounding context from the page (a few paragraphs around the highlight, not the entire page). Use DOM proximity, not full `document.body.innerText`.
- Cap the Agent Recall context: send only the 5-10 most relevant prior notes, not the entire history.
- Set hard token limits per request (e.g., max 4K input tokens for explanations).
- Implement token counting before sending requests -- estimate cost and warn users if a request would be unusually expensive.
- Track per-user daily token usage on the backend and implement soft limits.

**Warning signs:**
- Average tokens per request steadily increasing as users build history.
- User complaints about API costs being higher than expected.
- Backend logs showing requests with 10K+ input tokens.

**Phase to address:**
Phase 3 (AI Integration) -- when building the explanation and Agent Recall features. Token budgeting must be designed, not afterthought.

---

### Pitfall 8: SSE Streaming Buffered by Reverse Proxies, Producing Chunky Output

**What goes wrong:**
The FastAPI backend streams LLM tokens via Server-Sent Events (SSE). In production, a reverse proxy (Nginx, Cloudflare, AWS ALB) buffers the response, causing tokens to arrive in large chunks instead of word-by-word. The user sees nothing for seconds, then a wall of text appears at once. The "streaming" UX is completely lost.

**Why it happens:**
Reverse proxies buffer responses by default to optimize throughput for traditional request/response HTTP. SSE requires proxies to pass through chunks immediately. Developers test locally (no proxy) and everything streams beautifully. Then they deploy behind Nginx and it breaks.

**How to avoid:**
- Set `X-Accel-Buffering: no` header in FastAPI responses (FastAPI SSE does this automatically as of recent versions).
- Configure Nginx: `proxy_buffering off;` and `proxy_cache off;` for the streaming endpoint.
- Set `Cache-Control: no-cache` and `Connection: keep-alive` headers.
- Send heartbeat comments (`:ping`) every 15 seconds to keep connections alive through proxies.
- Test streaming through your actual production proxy stack, not just localhost.

**Warning signs:**
- Streaming works locally but not in production.
- Tokens arrive in batches instead of individually.
- Long delay before any tokens appear.

**Phase to address:**
Phase 3 (AI Integration) -- when implementing the streaming explanation flow. Must be tested against actual deployment infrastructure.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing API keys in chrome.storage without encryption | Quick implementation, works immediately | Security vulnerability, key theft risk | Never -- route through backend or encrypt from day one |
| Skipping Shadow DOM for popup UI | Faster to build, simpler CSS | CSS conflicts on every other website, endless bug reports | Never -- Shadow DOM is not much harder and prevents a class of bugs |
| Full page text as LLM context | Better explanation quality | Unbounded costs, slow responses, token limit errors | Only during prototyping with personal API keys |
| Global variables in service worker for state | Simplest code, works in testing | Silent state loss causing mysterious bugs | Never in MV3 -- use chrome.storage.session |
| Disabling RLS "temporarily" during development | Faster iteration, no empty results | Forgetting to re-enable, shipping exposed tables | Only if you have a CI check that verifies RLS is enabled on all tables |
| Single retry with no backoff for LLM API calls | Simpler error handling | Rate limit cascading, 429 storms, wasted tokens on duplicate requests | Never -- exponential backoff is minimal code |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth + Chrome Extension | Using Supabase JS client's default `localStorage` adapter | Provide custom storage adapter backed by `chrome.storage.local` with a synchronous in-memory cache |
| Supabase Auth + Google OAuth | Hardcoding the extension redirect URL | Use `chrome.identity.getRedirectURL()` dynamically; register both dev and prod IDs |
| FastAPI + OpenAI/Anthropic streaming | Using synchronous `requests` library | Use `httpx` with async streaming; yield chunks from an `async generator` in `StreamingResponse` |
| Chrome Extension + FastAPI | Sending auth tokens in URL query parameters | Send JWT in `Authorization: Bearer` header; CORS must explicitly allow this header |
| Supabase + FastAPI | Having FastAPI use the anon key to query Supabase | FastAPI should use the `service_role` key server-side, but validate the user's JWT first and scope queries to their `user_id` |
| Content Script + Side Panel | Communicating via background service worker message relay | Use `chrome.runtime.sendMessage` directly between content script and side panel; avoid unnecessary service worker hops that add failure points |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Content script injected on every page load with heavy initialization | Pages feel slower, users notice lag | Use `document_idle` run_at timing; lazy-load heavy modules only when user highlights text | Immediately on slow machines or complex pages |
| Querying all user notes on every explanation for Agent Recall | Explanation latency grows with user's note count | Use vector similarity or keyword search to fetch only top-N relevant notes; index the topics column | At 500+ saved notes |
| Side panel re-renders entire note list on every update | Panel becomes sluggish, scrolling janky | Use virtualized list rendering (e.g., react-window); memoize note components | At 100+ notes on a single page |
| Supabase realtime subscriptions for sync | Unnecessary database load, connection limits | Use polling or on-demand fetch for note sync; realtime only if collaborative features are added later | At 100+ concurrent users (Supabase free tier limits) |
| No debounce on highlight-to-explain trigger | Multiple API calls fired for a single highlight action | Debounce the text selection event by 300-500ms; only trigger after selection is stable | Immediately with fast mouse movements |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Supabase `service_role` key in extension code | Full database access bypass -- attacker can read/write/delete all user data | Only use `service_role` on the FastAPI backend; extension only gets `anon` key + user JWT |
| Sending user's LLM API key directly from extension to OpenAI/Anthropic | Key intercepted by malicious extensions, network sniffers, or browser compromises | Proxy all LLM calls through FastAPI; store API keys server-side encrypted |
| Not validating JWT on FastAPI endpoints | Anyone with the endpoint URL can call your API | Verify Supabase JWT signature on every request using `supabase-py` or manual JWT validation with the Supabase JWT secret |
| Over-broad `host_permissions` in manifest.json | Chrome Web Store review delays/rejection; users alarmed by permission requests | Request only `activeTab` permission; use `chrome.scripting.executeScript` for dynamic injection on the active tab |
| Content script reading sensitive page data (passwords, credit card fields) | Privacy violation, potential store rejection | Exclude form fields and input elements from text selection handling; never capture or transmit page content beyond the highlighted text |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Popup appears on every text selection, even unintentional | Extremely annoying; users uninstall within hours | Require minimum selection length (10+ chars); add 500ms delay; or require a modifier key (Ctrl+highlight) |
| Popup blocks the text being read | User cannot see what they highlighted | Position popup below or to the side of selection; ensure it does not overlap the highlighted text |
| No loading indicator during LLM streaming | User thinks extension is broken; clicks again triggering duplicate requests | Show a skeleton/spinner immediately; start streaming tokens as they arrive |
| Side panel steals keyboard focus from the page | User tries to type on the page but input goes to the side panel | Explicitly manage focus; do not auto-focus inputs in the side panel when it opens |
| Extension icon badge/notification on every save | Notification fatigue for an auto-save feature | Auto-save should be silent; only notify on errors or first-time usage |
| Explanation popup persists after navigating away | Stale popup on new page confuses user | Listen for navigation events; remove popup on URL change or scroll beyond threshold |

## "Looks Done But Isn't" Checklist

- [ ] **OAuth flow:** Works in unpacked dev build but will break when published (extension ID changes) -- verify with a packed .crx build
- [ ] **RLS policies:** Tables created but RLS not enabled -- run `SELECT tablename FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity` to check
- [ ] **Service worker state:** Features work after fresh install but break after Chrome restarts the worker -- test by going to chrome://extensions and manually terminating the service worker
- [ ] **Streaming:** Works locally but buffered in production -- test through your actual proxy/hosting stack
- [ ] **CSS isolation:** Popup looks good on your test page -- verify on Gmail, Google Docs, GitHub, Wikipedia, and a site with CSS reset
- [ ] **Token limits:** Explanations work for short highlights -- test with a 5000-word page and 200+ saved notes to check token limits
- [ ] **Error handling:** LLM call succeeds in testing -- simulate 429 rate limit, network timeout, invalid API key, and empty response
- [ ] **Side panel notes:** Shows a few notes correctly -- test with 500+ notes for virtualization/performance
- [ ] **Permission prompts:** Extension works in dev -- verify what permissions Chrome prompts for on first install (over-broad permissions scare users)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Service worker state loss | MEDIUM | Audit all global variables; migrate to chrome.storage.session; add initialization checks |
| Missing RLS on tables | HIGH | Audit all tables; write policies; test every query path; may need data audit for exposure |
| CSS leaking without Shadow DOM | HIGH | Rewrite all injected UI to use Shadow DOM; re-test on all target sites |
| Unbounded token costs | LOW | Add token counting middleware on FastAPI; set caps; trim context extraction logic |
| Hardcoded extension redirect URL | LOW | Switch to dynamic URL; register both IDs; redeploy |
| SSE buffering in production | LOW | Add proxy headers; reconfigure Nginx/CDN; redeploy |
| Insecure API key storage | MEDIUM | Migrate to backend proxy model; delete keys from chrome.storage; notify users to rotate keys |
| Popup CSS broken on specific sites | MEDIUM | Wrap in Shadow DOM; test against site list; may need site-specific fixes for extreme cases |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Service worker termination kills streaming | Phase 1 (Foundation) | Streaming works for 60+ second responses without interruption |
| RLS disabled/misconfigured | Phase 1 (Foundation) | CI check that all tables have RLS enabled; test queries as unauthenticated user return nothing |
| OAuth redirect URL mismatch | Phase 1 (Auth Setup) | Full OAuth flow works in both unpacked and packed extension builds |
| CSS leaking into/from host pages | Phase 2 (Core UI) | Popup renders identically on 10+ diverse websites |
| API key storage insecurity | Phase 1 (Foundation) | API keys never stored in plaintext in chrome.storage; all LLM calls route through backend |
| Service worker state loss | Phase 1 (Foundation) | Manually terminate service worker in chrome://extensions; all features still work |
| Unbounded token costs | Phase 3 (AI Integration) | Token count logged per request; no request exceeds configured cap; cost tracking dashboard |
| SSE buffering in production | Phase 3 (AI Integration) | Tokens stream word-by-word through production proxy stack |
| Popup triggers on unintentional selections | Phase 2 (Core UI) | Selection debounce and minimum length enforced; user testing confirms non-intrusiveness |

## Sources

- [Chrome Extension Service Worker Lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Migrate to Service Workers (MV3)](https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers)
- [Longer Extension Service Worker Lifetimes (Chrome 116)](https://developer.chrome.com/blog/longer-esw-lifetimes)
- [Mitigate Service Worker Timeout (Offscreen Document)](https://medium.com/@bhuvan.gandhi/chrome-extension-v3-mitigate-service-worker-timeout-issue-in-the-easiest-way-fccc01877abd)
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Security Flaw: 170+ Apps Exposed by Missing RLS](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/)
- [Fixing RLS Misconfigurations in Supabase](https://prosperasoft.com/blog/database/supabase/supabase-rls-issues/)
- [Supabase Auth in Chrome Extension](https://pustelto.com/blog/supabase-auth/)
- [Supabase Auth in Chrome Extension: What You Won't Find in the Docs](https://chethiyakd.medium.com/supabase-auth-in-a-chrome-extension-what-you-wont-find-in-the-docs-a2ae6691cca3)
- [Chrome Extension Content Script CSS Isolation with Shadow DOM](https://dev.to/developertom01/solving-css-and-javascript-interference-in-chrome-extensions-a-guide-to-react-shadow-dom-and-best-practices-9l)
- [Chrome Extensions Vulnerability Leaks API Keys](https://thehackernews.com/2025/06/popular-chrome-extensions-leak-api-keys.html)
- [How to Secure API Keys in Chrome Extension](https://dev.to/notearthian/how-to-secure-api-keys-in-chrome-extension-3f19)
- [FastAPI SSE for LLM Streaming](https://medium.com/@hadiyolworld007/fastapi-sse-for-llm-tokens-smooth-streaming-without-websockets-001ead4b5e53)
- [Fix Your FastAPI LLM Stream](https://junkangworld.com/blog/fix-your-fastapi-llm-stream-get-word-by-word-in-2025)
- [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
- [Improve Extension Security (MV3 CSP)](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security)

---
*Pitfalls research for: Chrome Extension AI Learning Tool (bubb)*
*Researched: 2026-03-21*
