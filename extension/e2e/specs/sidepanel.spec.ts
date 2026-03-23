import { test, expect } from '../fixtures/extension';
import { SidePanelPage } from '../fixtures/pages/sidepanel.page';
import { injectAuthSession, clearAuthSession } from '../fixtures/auth';

test.describe('Side Panel', () => {
  let panel: SidePanelPage;

  test.beforeEach(async ({ context, extensionId, backgroundSW }) => {
    await clearAuthSession(backgroundSW);
    const page = await context.newPage();
    panel = new SidePanelPage(page, extensionId);
  });

  test.describe('Signed Out', () => {
    test('shows SignedOutView when unauthenticated', async () => {
      await panel.goto();
      await expect(panel.learnLabel).toBeVisible();
      await expect(panel.heading).toBeVisible();
      await expect(panel.continueWithGoogleButton).toBeVisible();
      await expect(panel.featureCardExplain).toBeVisible();
      await expect(panel.featureCardSave).toBeVisible();
    });
  });

  test.describe('Signed In', () => {
    test.beforeEach(async ({ backgroundSW }) => {
      await injectAuthSession(backgroundSW);
    });

    test('shows SignedInView when authenticated', async () => {
      await panel.goto();
      await expect(panel.dashboardLabel).toBeVisible();
      await expect(panel.greeting('Test')).toBeVisible();
      await expect(panel.initialsAvatar).toBeVisible();
      await expect(panel.notesStatLabel).toBeVisible();
      await expect(panel.topicsStatLabel).toBeVisible();
      await expect(panel.pagesStatLabel).toBeVisible();
      await expect(panel.explainActionCard).toBeVisible();
      await expect(panel.notesActionCard).toBeVisible();
      await expect(panel.topicsActionCard).toBeVisible();
    });

    test('sign out flow with confirmation', async () => {
      await panel.goto();
      await panel.signOutButton.click();
      await expect(panel.signOutConfirmText).toBeVisible();
      await panel.signOutConfirmButton.click();
      // Should return to signed out view
      await expect(panel.learnLabel).toBeVisible({ timeout: 5000 });
    });

    test('sign out cancel stays on dashboard', async () => {
      await panel.goto();
      await panel.signOutButton.click();
      await expect(panel.signOutConfirmText).toBeVisible();
      await panel.signOutCancelButton.click();
      await expect(panel.signOutConfirmText).not.toBeVisible();
      await expect(panel.dashboardLabel).toBeVisible();
    });
  });
});
