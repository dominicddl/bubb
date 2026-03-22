import './style.css';
import ReactDOM from 'react-dom/client';
import { getSelectedTextInfo } from './lib/selection';
import { extractSurroundingContext } from './lib/context';
import { calculatePopupPosition } from './lib/positioning';

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

          // Placeholder render -- Plan 03 will replace with ExplanationPopup
          root.render(
            <div style={{
              position: 'absolute',
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: '400px',
              maxHeight: '300px',
            }}>
              {/* ExplanationPopup will be mounted here in Plan 03 */}
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
                <p className="text-[14px] font-semibold text-[hsl(var(--foreground))]">
                  {text.length > 80 ? text.substring(0, 80) + '...' : text}
                </p>
                <p className="mt-2 text-[12px] text-[hsl(var(--muted-foreground))]">Loading explanation...</p>
              </div>
            </div>
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
