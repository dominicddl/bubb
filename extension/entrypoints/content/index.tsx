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

    function closePopup() {
      if (currentUi) {
        currentUi.remove();
        currentUi = null;
      }
    }

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

            root.render(
              <ExplanationPopup
                selectedText={text}
                context={context}
                sourceUrl={sourceUrl}
                pageTitle={pageTitle}
                position={position}
                onClose={closePopup}
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
