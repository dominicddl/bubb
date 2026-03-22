// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSelectedTextInfo } from '../../entrypoints/content/lib/selection';

describe('getSelectedTextInfo', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when window.getSelection() returns null', () => {
    vi.spyOn(window, 'getSelection').mockReturnValue(null);
    expect(getSelectedTextInfo()).toBeNull();
  });

  it('returns null when selection has no range (rangeCount === 0)', () => {
    const mockSelection = {
      rangeCount: 0,
      toString: () => '',
      getRangeAt: vi.fn(),
      anchorNode: document.createTextNode('test'),
    } as unknown as Selection;
    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);
    expect(getSelectedTextInfo()).toBeNull();
  });

  it('returns null for selections under 3 characters (D-02)', () => {
    const mockRange = {
      getBoundingClientRect: () => new DOMRect(10, 20, 50, 20),
    } as unknown as Range;
    const mockSelection = {
      rangeCount: 1,
      toString: () => 'ab',
      getRangeAt: vi.fn().mockReturnValue(mockRange),
      anchorNode: document.createTextNode('ab'),
    } as unknown as Selection;
    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);
    expect(getSelectedTextInfo()).toBeNull();
  });

  it('returns null for exactly 2 characters after trim', () => {
    const mockRange = {
      getBoundingClientRect: () => new DOMRect(10, 20, 50, 20),
    } as unknown as Range;
    const mockSelection = {
      rangeCount: 1,
      toString: () => '  a  ',
      getRangeAt: vi.fn().mockReturnValue(mockRange),
      anchorNode: document.createTextNode('a'),
    } as unknown as Selection;
    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);
    expect(getSelectedTextInfo()).toBeNull();
  });

  it('trims whitespace before checking length', () => {
    const mockRange = {
      getBoundingClientRect: () => new DOMRect(10, 20, 50, 20),
    } as unknown as Range;
    const mockSelection = {
      rangeCount: 1,
      toString: () => '   ab   ',
      getRangeAt: vi.fn().mockReturnValue(mockRange),
      anchorNode: document.createTextNode('ab'),
    } as unknown as Selection;
    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);
    // "ab" is only 2 chars after trim, so should return null
    expect(getSelectedTextInfo()).toBeNull();
  });

  it('returns {text, rect, anchorNode} for selections of 3+ characters', () => {
    const mockRect = new DOMRect(10, 20, 50, 20);
    const anchorNode = document.createTextNode('hello world');
    const mockRange = {
      getBoundingClientRect: () => mockRect,
    } as unknown as Range;
    const mockSelection = {
      rangeCount: 1,
      toString: () => 'hello world',
      getRangeAt: vi.fn().mockReturnValue(mockRange),
      anchorNode,
    } as unknown as Selection;
    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);

    const result = getSelectedTextInfo();
    expect(result).not.toBeNull();
    expect(result!.text).toBe('hello world');
    expect(result!.rect).toBe(mockRect);
    expect(result!.anchorNode).toBe(anchorNode);
  });

  it('returns trimmed text in the result', () => {
    const anchorNode = document.createTextNode('  trimmed text  ');
    const mockRange = {
      getBoundingClientRect: () => new DOMRect(0, 0, 100, 20),
    } as unknown as Range;
    const mockSelection = {
      rangeCount: 1,
      toString: () => '  trimmed text  ',
      getRangeAt: vi.fn().mockReturnValue(mockRange),
      anchorNode,
    } as unknown as Selection;
    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);

    const result = getSelectedTextInfo();
    expect(result!.text).toBe('trimmed text');
  });

  it('returns null when anchorNode is null', () => {
    const mockRange = {
      getBoundingClientRect: () => new DOMRect(10, 20, 50, 20),
    } as unknown as Range;
    const mockSelection = {
      rangeCount: 1,
      toString: () => 'valid text',
      getRangeAt: vi.fn().mockReturnValue(mockRange),
      anchorNode: null,
    } as unknown as Selection;
    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);
    expect(getSelectedTextInfo()).toBeNull();
  });
});
