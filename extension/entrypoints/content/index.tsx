import './style.css';
import ReactDOM from 'react-dom/client';
import { getSelectedTextInfo } from './lib/selection';
import { extractSurroundingContext } from './lib/context';
import { calculatePopupPosition } from './lib/positioning';
import { ExplanationPopup } from './components/ExplanationPopup';
import type { DepthLevel } from '@/lib/messaging';

type DepthCache = Record<DepthLevel, string>;

// Cache explanations so re-highlighting the same text reuses previous results
const explanationCache = new Map<string, DepthCache>();

function showAuthToast(message: string) {
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    top: '16px',
    right: '16px',
    padding: '10px 18px',
    background: '#1a1a1a',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    zIndex: '2147483647',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    opacity: '0',
    transition: 'opacity 0.2s ease',
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',

  async main(ctx) {
    let currentUi: Awaited<ReturnType<typeof createShadowRootUi>> | null = null;

    function closePopup() {
      if (currentUi) {
        currentUi.remove();
        currentUi = null;
      }
    }

    // Listen for auth state changes from background to show sign-in confirmation
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'AUTH_STATE_CHANGED' && message.payload?.isAuthenticated) {
        const name = message.payload.user?.name || 'User';
        showAuthToast(`Signed in as ${name}`);
      }
    });

    document.addEventListener('mouseup', async (event) => {
      try {
        // If click is inside our shadow host, let React handle it
        if (currentUi) {
          const composedPath = event.composedPath();
          const shadowHost = currentUi.shadowHost;
          if (composedPath.includes(shadowHost)) {
            return;
          }
        }

        const selectionInfo = getSelectedTextInfo();

        if (!selectionInfo) {
          closePopup();
          return;
        }

        closePopup();

        const { text, rect, anchorNode } = selectionInfo;
        const context = extractSurroundingContext(anchorNode);
        const position = calculatePopupPosition(rect);
        const sourceUrl = window.location.href;
        const pageTitle = document.title;

        currentUi = await createShadowRootUi(ctx, {
          name: 'bubb-popup',
          position: 'overlay',
          anchor: document.body,
          onMount: (container) => {
            const host = (container.getRootNode() as ShadowRoot).host as HTMLElement;
            host.style.zIndex = '2147483647';
            host.style.position = 'fixed';
            host.style.top = '0';
            host.style.left = '0';

            const app = document.createElement('div');
            container.append(app);
            const root = ReactDOM.createRoot(app);

            const cachedResult = explanationCache.get(text);
            const handleCacheUpdate = (cache: DepthCache) => {
              explanationCache.set(text, cache);
            };

            root.render(
              <ExplanationPopup
                selectedText={text}
                context={context}
                sourceUrl={sourceUrl}
                pageTitle={pageTitle}
                position={position}
                onClose={closePopup}
                initialCache={cachedResult}
                onCacheUpdate={handleCacheUpdate}
              />
            );
            return root;
          },
          onRemove: (root) => {
            root?.unmount();
          },
        });

        currentUi.mount();

      } catch (err) {
        console.error('[bubb] mouseup handler error:', err);
        currentUi = null;
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePopup();
    });

    ctx.onInvalidated(closePopup);
  },
});
