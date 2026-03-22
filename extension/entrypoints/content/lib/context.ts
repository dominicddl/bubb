const BLOCK_ELEMENTS = new Set([
  'P', 'DIV', 'SECTION', 'ARTICLE', 'MAIN', 'ASIDE',
  'BLOCKQUOTE', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'PRE', 'FIGURE', 'FIGCAPTION', 'TD', 'TH',
]);

const MAX_CONTEXT_LENGTH = 500;

/**
 * Extract surrounding text context from the DOM near the selection.
 * Per D-17/D-18: Walks up to nearest block-level parent, grabs textContent.
 * If short (< 200 chars), grabs adjacent siblings too. Capped at 500 chars.
 */
export function extractSurroundingContext(anchorNode: Node): string {
  if (!anchorNode) return '';

  let blockParent: Element | null = anchorNode.nodeType === Node.ELEMENT_NODE
    ? anchorNode as Element
    : anchorNode.parentElement;

  while (blockParent && !BLOCK_ELEMENTS.has(blockParent.tagName)) {
    blockParent = blockParent.parentElement;
  }

  if (!blockParent) return '';

  let context = blockParent.textContent?.trim() || '';

  if (context.length < 200 && blockParent.parentElement) {
    const parent = blockParent.parentElement;
    const siblings = Array.from(parent.children);
    const idx = siblings.indexOf(blockParent);

    const prev = idx > 0 ? siblings[idx - 1].textContent?.trim() : '';
    const next = idx < siblings.length - 1 ? siblings[idx + 1].textContent?.trim() : '';

    context = [prev, context, next].filter(Boolean).join(' ');
  }

  if (context.length > MAX_CONTEXT_LENGTH) {
    context = context.substring(0, MAX_CONTEXT_LENGTH) + '...';
  }

  return context;
}
