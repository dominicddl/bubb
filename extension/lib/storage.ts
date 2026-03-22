/**
 * Custom storage adapter for Supabase auth in Chrome Extension contexts.
 * Required because service workers lack localStorage.
 * Uses in-memory cache + chrome.storage.local for persistence.
 */
const cache: Record<string, string> = {};

export const chromeStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (key in cache) return cache[key];
    const result = await chrome.storage.local.get(key);
    const value = result[key] ?? null;
    if (value !== null) cache[key] = value;
    return value;
  },
  async setItem(key: string, value: string): Promise<void> {
    cache[key] = value;
    await chrome.storage.local.set({ [key]: value });
  },
  async removeItem(key: string): Promise<void> {
    delete cache[key];
    await chrome.storage.local.remove(key);
  },
};
