// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCurrentTab } from '../../entrypoints/sidepanel/hooks/useCurrentTab';

// Shared listener registries — reset between tests
let onActivatedListeners: Array<(info: { tabId: number; windowId: number }) => void> = [];
let onUpdatedListeners: Array<
  (
    tabId: number,
    changeInfo: { url?: string; status?: string },
    tab: { active: boolean; url?: string; title?: string },
  ) => void
> = [];

// Build a persistent chrome stub that stays for the life of the module
// (avoids "chrome is not defined" during React cleanup in afterEach)
const mockQuery = vi.fn();
const mockGet = vi.fn();

const chromeMock = {
  tabs: {
    query: mockQuery,
    get: mockGet,
    onActivated: {
      addListener: vi.fn((cb) => { onActivatedListeners.push(cb); }),
      removeListener: vi.fn((cb) => {
        onActivatedListeners = onActivatedListeners.filter((l) => l !== cb);
      }),
    },
    onUpdated: {
      addListener: vi.fn((cb) => { onUpdatedListeners.push(cb); }),
      removeListener: vi.fn((cb) => {
        onUpdatedListeners = onUpdatedListeners.filter((l) => l !== cb);
      }),
    },
  },
  runtime: {
    lastError: undefined as undefined | { message: string },
  },
};

// Install chrome globally once for all tests — never unstub so cleanup never breaks
vi.stubGlobal('chrome', chromeMock);

beforeEach(() => {
  onActivatedListeners = [];
  onUpdatedListeners = [];
  vi.clearAllMocks();

  // Re-wire listener implementations after clearAllMocks
  chromeMock.tabs.onActivated.addListener.mockImplementation((cb) => {
    onActivatedListeners.push(cb);
  });
  chromeMock.tabs.onActivated.removeListener.mockImplementation((cb) => {
    onActivatedListeners = onActivatedListeners.filter((l) => l !== cb);
  });
  chromeMock.tabs.onUpdated.addListener.mockImplementation((cb) => {
    onUpdatedListeners.push(cb);
  });
  chromeMock.tabs.onUpdated.removeListener.mockImplementation((cb) => {
    onUpdatedListeners = onUpdatedListeners.filter((l) => l !== cb);
  });
});

describe('useCurrentTab', () => {
  it('returns null initially before chrome.tabs.query resolves', () => {
    // Make query never call its callback — simulates pending async
    mockQuery.mockImplementation(() => {});

    const { result } = renderHook(() => useCurrentTab());
    expect(result.current).toBeNull();
  });

  it('returns current tab url and title after chrome.tabs.query resolves', async () => {
    mockQuery.mockImplementation((_filter: unknown, callback: (tabs: unknown[]) => void) => {
      callback([{ url: 'https://example.com', title: 'Example' }]);
    });

    const { result } = renderHook(() => useCurrentTab());

    await act(async () => {});

    expect(result.current).toEqual({ url: 'https://example.com', title: 'Example' });
  });

  it('updates on tab activated — fires chrome.tabs.onActivated listener', async () => {
    mockQuery.mockImplementation((_filter: unknown, callback: (tabs: unknown[]) => void) => {
      callback([{ url: 'https://first.com', title: 'First' }]);
    });
    mockGet.mockImplementation((_tabId: number, callback: (tab: unknown) => void) => {
      callback({ url: 'https://second.com', title: 'Second' });
    });

    const { result } = renderHook(() => useCurrentTab());

    await act(async () => {});
    expect(result.current).toEqual({ url: 'https://first.com', title: 'First' });

    await act(async () => {
      for (const listener of onActivatedListeners) {
        listener({ tabId: 42, windowId: 1 });
      }
    });

    expect(result.current).toEqual({ url: 'https://second.com', title: 'Second' });
  });

  it('updates on tab url change — fires chrome.tabs.onUpdated with url in changeInfo', async () => {
    mockQuery.mockImplementation((_filter: unknown, callback: (tabs: unknown[]) => void) => {
      callback([{ url: 'https://old.com', title: 'Old' }]);
    });

    const { result } = renderHook(() => useCurrentTab());

    await act(async () => {});
    expect(result.current).toEqual({ url: 'https://old.com', title: 'Old' });

    await act(async () => {
      for (const listener of onUpdatedListeners) {
        listener(1, { url: 'https://new.com' }, { active: true, url: 'https://new.com', title: 'New Page' });
      }
    });

    expect(result.current).toEqual({ url: 'https://new.com', title: 'New Page' });
  });

  it('ignores onUpdated when changeInfo has no url (e.g. status-only change)', async () => {
    mockQuery.mockImplementation((_filter: unknown, callback: (tabs: unknown[]) => void) => {
      callback([{ url: 'https://stable.com', title: 'Stable' }]);
    });

    const { result } = renderHook(() => useCurrentTab());

    await act(async () => {});
    expect(result.current).toEqual({ url: 'https://stable.com', title: 'Stable' });

    await act(async () => {
      for (const listener of onUpdatedListeners) {
        listener(1, { status: 'loading' }, { active: true, url: 'https://stable.com', title: 'Stable' });
      }
    });

    // Should not have changed — no url in changeInfo
    expect(result.current).toEqual({ url: 'https://stable.com', title: 'Stable' });
  });
});
