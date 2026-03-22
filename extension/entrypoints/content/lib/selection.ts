export interface SelectionInfo {
  text: string;
  rect: DOMRect;
  anchorNode: Node;
}

/**
 * Get current text selection if it meets the minimum length requirement.
 * Per D-02: minimum 3 characters after trimming.
 * IMPORTANT: Call this BEFORE mounting Shadow DOM (Pitfall 3 -- selection can be lost after DOM mutation).
 */
export function getSelectedTextInfo(): SelectionInfo | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const text = selection.toString().trim();
  if (text.length < 3) return null;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const anchorNode = selection.anchorNode;
  if (!anchorNode) return null;

  return { text, rect, anchorNode };
}
