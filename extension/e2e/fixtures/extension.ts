import { test as base, chromium, type BrowserContext, type Worker } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load extension .env for Supabase URL
const extensionDir = path.resolve(__dirname, '../..');
const envPath = path.join(extensionDir, '.env');
const envVars = dotenv.parse(fs.readFileSync(envPath));

export const SUPABASE_URL = envVars.WXT_SUPABASE_URL;

export function getSupabaseStorageKey(): string {
  const url = new URL(SUPABASE_URL);
  const ref = url.hostname.split('.')[0];
  return `sb-${ref}-auth-token`;
}

export type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
  backgroundSW: Worker;
};

export const test = base.extend<ExtensionFixtures>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const extensionPath = path.resolve(__dirname, '../../.output/chrome-mv3');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
        '--disable-gpu',
      ],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let sw = context.serviceWorkers()[0];
    if (!sw) {
      sw = await context.waitForEvent('serviceworker');
    }
    const extensionId = sw.url().split('/')[2];
    await use(extensionId);
  },

  backgroundSW: async ({ context }, use) => {
    let sw = context.serviceWorkers()[0];
    if (!sw) {
      sw = await context.waitForEvent('serviceworker');
    }
    await use(sw);
  },
});

export { expect } from '@playwright/test';
