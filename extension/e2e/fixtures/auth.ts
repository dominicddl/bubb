import type { Worker } from '@playwright/test';
import { getSupabaseStorageKey } from './extension';

const STORAGE_KEY = getSupabaseStorageKey();

export function createMockSession(overrides?: Record<string, unknown>) {
  return JSON.stringify({
    access_token: 'fake-jwt-for-testing',
    refresh_token: 'fake-refresh',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'test-user-uuid',
      email: 'test@example.com',
      email_confirmed_at: '2026-01-01T00:00:00Z',
      user_metadata: { full_name: 'Test User' },
      aud: 'authenticated',
      role: 'authenticated',
      ...overrides,
    },
  });
}

export async function injectAuthSession(sw: Worker, session?: string) {
  const mockSession = session ?? createMockSession();
  await sw.evaluate(
    ({ key, value }) => {
      (chrome.storage.local as any).set({ [key]: value });
    },
    { key: STORAGE_KEY, value: mockSession },
  );
}

export async function clearAuthSession(sw: Worker) {
  await sw.evaluate(
    ({ key }) => {
      (chrome.storage.local as any).remove(key);
    },
    { key: STORAGE_KEY },
  );
}
