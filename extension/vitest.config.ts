import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      // Content script tests need DOM APIs
      ['tests/content/**', 'happy-dom'],
      // Sidepanel tests need DOM APIs for React hooks
      ['tests/sidepanel/**', 'happy-dom'],
    ],
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', '.output', '.wxt'],
  },
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
});
