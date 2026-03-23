import { test, expect } from '../../fixtures/extension';
import { ContentPage } from '../../fixtures/pages/content.page';
import { injectAuthSession } from '../../fixtures/auth';
import { mockSupabaseNotes } from '../../fixtures/mocks';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });

const BACKEND_URL = process.env.BACKEND_URL;

test.describe('Smoke: Real Backend', () => {
  test.skip(!BACKEND_URL, 'Skipped: BACKEND_URL not set in .env.test');

  test('highlight text gets real AI explanation', async ({ context, backgroundSW }) => {
    await injectAuthSession(backgroundSW);
    const page = await context.newPage();
    await mockSupabaseNotes(page);
    const content = new ContentPage(page);
    await content.goto();
    await content.highlightText('Photosynthesis');

    // Wait for real API response (may take several seconds)
    await expect(content.explanationText).toBeVisible({ timeout: 30000 });
    // Verify it contains actual explanation content (not empty)
    const text = await content.explanationText.textContent();
    expect(text?.length).toBeGreaterThan(20);
  });
});
