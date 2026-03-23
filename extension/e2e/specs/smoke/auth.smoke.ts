import { test, expect } from '../../fixtures/extension';
import { SidePanelPage } from '../../fixtures/pages/sidepanel.page';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });

const GOOGLE_EMAIL = process.env.GOOGLE_TEST_EMAIL;
const GOOGLE_PASSWORD = process.env.GOOGLE_TEST_PASSWORD;

test.describe('Smoke: Real Google OAuth', () => {
  test.skip(!GOOGLE_EMAIL || !GOOGLE_PASSWORD, 'Skipped: GOOGLE_TEST_EMAIL or GOOGLE_TEST_PASSWORD not set in .env.test');

  test('sign in with real Google account', async ({ context, extensionId }) => {
    test.setTimeout(120000); // Google OAuth can be slow
    const page = await context.newPage();
    const panel = new SidePanelPage(page, extensionId);
    await panel.goto();

    // Click sign in — this will open a new tab with Google OAuth
    const [googlePage] = await Promise.all([
      context.waitForEvent('page'),
      panel.continueWithGoogleButton.click(),
    ]);

    // Fill in Google credentials
    await googlePage.waitForLoadState('networkidle');
    await googlePage.fill('input[type="email"]', GOOGLE_EMAIL!);
    await googlePage.click('#identifierNext');
    await googlePage.waitForTimeout(2000);
    await googlePage.fill('input[type="password"]', GOOGLE_PASSWORD!);
    await googlePage.click('#passwordNext');

    // Wait for redirect back and verify authenticated state
    await page.waitForTimeout(5000);
    await panel.goto(); // Reload to pick up new auth state
    await expect(panel.dashboardLabel).toBeVisible({ timeout: 15000 });
  });
});
