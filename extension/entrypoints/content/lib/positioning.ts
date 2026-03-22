const POPUP_WIDTH = 400;
const POPUP_MAX_HEIGHT = 300;
const VIEWPORT_PADDING = 16; // per UI-SPEC spacing, 16px min from viewport edge

export interface PopupPosition {
  top: number;
  left: number;
}

/**
 * Calculate popup position near the text selection.
 * Per D-03: floats near selection end, repositions if near viewport edges.
 * Per UI-SPEC: 8px below selection, clamped 16px from viewport edges.
 */
export function calculatePopupPosition(selectionRect: DOMRect): PopupPosition {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // Default: 8px below selection, right-aligned to selection end
  let top = selectionRect.bottom + scrollY + 8;
  let left = selectionRect.right + scrollX - POPUP_WIDTH;

  // Clamp left to viewport
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING;
  }
  if (left + POPUP_WIDTH > window.innerWidth - VIEWPORT_PADDING) {
    left = window.innerWidth - VIEWPORT_PADDING - POPUP_WIDTH;
  }

  // If popup would go below viewport, show above selection
  if (selectionRect.bottom + POPUP_MAX_HEIGHT + 8 > window.innerHeight) {
    top = selectionRect.top + scrollY - POPUP_MAX_HEIGHT - 8;
  }

  return { top: Math.max(VIEWPORT_PADDING, top), left };
}
