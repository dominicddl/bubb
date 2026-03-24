import type { Page, Worker } from '@playwright/test';

// --- Service worker fetch mocking (for /api/explain) ---

export async function mockExplainResponse(
  sw: Worker,
  response?: { explanation: string },
) {
  const explanation = response?.explanation ?? 'Mock explanation for testing.';
  await sw.evaluate((exp) => {
    const originalFetch = globalThis.fetch;
    (globalThis as any).__originalFetch = originalFetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
      if (url.includes('/api/explain')) {
        return new Response(
          JSON.stringify({ explanation: exp }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return originalFetch(input, init);
    };
  }, explanation);
}

export async function mockExplainError(sw: Worker, errorMessage?: string) {
  const msg = errorMessage ?? 'API error: 500';
  await sw.evaluate((errMsg) => {
    const originalFetch = globalThis.fetch;
    (globalThis as any).__originalFetch = originalFetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
      if (url.includes('/api/explain')) {
        return new Response(
          JSON.stringify({ detail: errMsg }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return originalFetch(input, init);
    };
  }, msg);
}

export async function resetServiceWorkerFetch(sw: Worker) {
  await sw.evaluate(() => {
    if ((globalThis as any).__originalFetch) {
      globalThis.fetch = (globalThis as any).__originalFetch;
      delete (globalThis as any).__originalFetch;
    }
  });
}

// --- Page-level route mocking (for Supabase notes CRUD from content script) ---

export async function mockSupabaseNotes(page: Page) {
  await page.route('**/rest/v1/notes**', (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'mock-note-id' }]),
      });
    } else if (method === 'DELETE') {
      route.fulfill({ status: 204 });
    } else if (method === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else {
      route.continue();
    }
  });
}

export async function mockSupabaseNotesError(page: Page, status = 500) {
  await page.route('**/rest/v1/notes**', (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Database error' }),
    });
  });
}
