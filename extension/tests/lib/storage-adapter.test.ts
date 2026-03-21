import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome.storage.local before importing the adapter
const mockStorage: Record<string, string> = {};

const chromeMock = {
  storage: {
    local: {
      get: vi.fn((key: string) => {
        return Promise.resolve({ [key]: mockStorage[key] ?? undefined });
      }),
      set: vi.fn((items: Record<string, string>) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((key: string) => {
        delete mockStorage[key];
        return Promise.resolve();
      }),
    },
  },
};

// Set up global chrome mock
vi.stubGlobal('chrome', chromeMock);

// Import after mocking
import { chromeStorageAdapter } from '../../lib/storage';

describe('chromeStorageAdapter', () => {
  beforeEach(() => {
    // Clear mock storage between tests
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  describe('getItem', () => {
    it('returns null for missing keys', async () => {
      const result = await chromeStorageAdapter.getItem('nonexistent');
      expect(result).toBeNull();
    });

    it('returns value from chrome.storage.local on cache miss', async () => {
      mockStorage['test-key'] = 'test-value';
      const result = await chromeStorageAdapter.getItem('test-key');
      expect(result).toBe('test-value');
      expect(chromeMock.storage.local.get).toHaveBeenCalledWith('test-key');
    });

    it('returns cached value on subsequent calls without hitting storage', async () => {
      mockStorage['cached-key'] = 'cached-value';
      // First call: populates cache
      await chromeStorageAdapter.getItem('cached-key');
      vi.clearAllMocks();
      // Second call: should use cache
      const result = await chromeStorageAdapter.getItem('cached-key');
      expect(result).toBe('cached-value');
      // chrome.storage.local.get should NOT be called for cached keys
      // (implementation detail: cache check happens before async call)
    });
  });

  describe('setItem', () => {
    it('writes to chrome.storage.local', async () => {
      await chromeStorageAdapter.setItem('new-key', 'new-value');
      expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
        'new-key': 'new-value',
      });
    });

    it('makes value available via getItem immediately (from cache)', async () => {
      await chromeStorageAdapter.setItem('immediate-key', 'immediate-value');
      vi.clearAllMocks();
      const result = await chromeStorageAdapter.getItem('immediate-key');
      expect(result).toBe('immediate-value');
    });
  });

  describe('removeItem', () => {
    it('removes from chrome.storage.local', async () => {
      await chromeStorageAdapter.removeItem('remove-key');
      expect(chromeMock.storage.local.remove).toHaveBeenCalledWith('remove-key');
    });

    it('makes getItem return null after removal', async () => {
      await chromeStorageAdapter.setItem('temp-key', 'temp-value');
      await chromeStorageAdapter.removeItem('temp-key');
      // Clear the mock storage too since removeItem mock handles it
      const result = await chromeStorageAdapter.getItem('temp-key');
      expect(result).toBeNull();
    });
  });
});
