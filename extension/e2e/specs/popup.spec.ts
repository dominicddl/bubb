import { test, expect } from '../fixtures/extension';
import { PopupPage } from '../fixtures/pages/popup.page';
import { injectAuthSession, clearAuthSession } from '../fixtures/auth';

test.describe('Popup', () => {
  let popup: PopupPage;

  test.beforeEach(async ({ context, extensionId, backgroundSW }) => {
    await clearAuthSession(backgroundSW);
    const page = await context.newPage();
    popup = new PopupPage(page, extensionId);
  });

  test('shows signed-out state by default', async () => {
    await popup.goto();
    await expect(popup.signInLabel).toBeVisible();
    await expect(popup.signInButton).toBeVisible();
    await expect(popup.signInButton).toBeEnabled();
  });

  test('shows signed-in state when authenticated', async ({ backgroundSW }) => {
    await injectAuthSession(backgroundSW);
    await popup.goto();
    await expect(popup.readyLabel).toBeVisible();
    await expect(popup.sidePanelInstruction).toBeVisible();
  });

  test('sign in button exists and is clickable', async () => {
    await popup.goto();
    await expect(popup.signInButton).toBeVisible();
    await expect(popup.signInButton).toBeEnabled();
  });
});
