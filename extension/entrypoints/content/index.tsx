import './style.css';
import ReactDOM from 'react-dom/client';
import { getSelectedTextInfo } from './lib/selection';
import { extractSurroundingContext } from './lib/context';
import { calculatePopupPosition } from './lib/positioning';
import { ExplanationPopup } from './components/ExplanationPopup';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',

  async main(ctx) {
    let currentUi: Awaited<ReturnType<typeof createShadowRootUi>> | null = null;
    let abortController: AbortController | null = null;

    document.addEventListener('mouseup', async (event) => {
      // Capture selection info BEFORE any DOM mutations (Pitfall 3)
      const selectionInfo = getSelectedTextInfo();

      if (!selectionInfo) {
        // Clicked without valid selection -- check for click-outside dismiss (D-04)
        // Only dismiss if click is outside the shadow host
        if (currentUi) {
          const composedPath = event.composedPath();
          const shadowHost = currentUi.shadowHost;
          if (!composedPath.includes(shadowHost)) {
            currentUi.remove();
            currentUi = null;
          }
        }
        return;
      }

      // D-05: New highlight replaces current popup (previous note already saved)
      if (currentUi) {
        currentUi.remove();
        currentUi = null;
      }

      // Cancel any in-flight API request (Pitfall 7)
      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();

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
          // Apply z-index to shadow host (per UI-SPEC: max safe integer)
          const shadowHost = container.closest('[data-wxt-shadow-root]') || container.parentElement;
          if (shadowHost instanceof HTMLElement) {
            shadowHost.style.zIndex = '2147483647';
            shadowHost.style.position = 'fixed';
          }

          const app = document.createElement('div');
          container.append(app);
          const root = ReactDOM.createRoot(app);

          root.render(
            <ExplanationPopup
              selectedText={text}
              context={context}
              sourceUrl={sourceUrl}
              pageTitle={pageTitle}
              position={position}
              onClose={() => { currentUi?.remove(); currentUi = null; }}
              abortSignal={abortController!.signal}
            />
          );
          return root;
        },
        onRemove: (root) => {
          root?.unmount();
        },
      });

      currentUi.mount();
    });

    // D-04: Escape key dismisses popup
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && currentUi) {
        currentUi.remove();
        currentUi = null;
      }
    });

    // Cleanup listeners when content script context is invalidated (anti-pattern: listener leak)
    ctx.onInvalidated(() => {
      if (currentUi) {
        currentUi.remove();
        currentUi = null;
      }
    });
  },
});
