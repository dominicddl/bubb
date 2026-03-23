import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'html',
  globalSetup: path.resolve(__dirname, 'global-setup.ts'),
  projects: [
    {
      name: 'e2e',
      testDir: './specs',
      testIgnore: ['**/smoke/**'],
    },
    {
      name: 'smoke',
      testDir: './specs/smoke',
    },
  ],
});
