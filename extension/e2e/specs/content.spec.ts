import { test, expect } from '../fixtures/extension';
import { ContentPage } from '../fixtures/pages/content.page';
import { injectAuthSession, clearAuthSession } from '../fixtures/auth';
import {
  mockExplainResponse,
  mockExplainError,
  mockSupabaseNotes,
  mockSupabaseNotesError,
  resetServiceWorkerFetch,
} from '../fixtures/mocks';

test.describe('Content Script — Explanation Popup', () => {
  let content: ContentPage;

  test.beforeEach(async ({ context, backgroundSW }) => {
    await clearAuthSession(backgroundSW);
    await resetServiceWorkerFetch(backgroundSW);
    const page = await context.newPage();
    content = new ContentPage(page);
  });

  test.describe('Basic popup behavior', () => {
    test('highlight text shows explanation popup', async ({ backgroundSW }) => {
      await mockExplainResponse(backgroundSW);
      await content.goto();
      await content.highlightText('Photosynthesis');
      await expect(content.popupHost).toBeVisible({ timeout: 5000 });
    });

    test('popup shows explanation text', async ({ backgroundSW }) => {
      await mockExplainResponse(backgroundSW, {
        explanation: 'Photosynthesis converts light to chemical energy.',
      });
      await content.goto();
      await content.highlightText('Photosynthesis');
      await expect(content.explanationText).toContainText(
        'Photosynthesis converts light to chemical energy.',
        { timeout: 5000 },
      );
    });

    test('popup header shows highlighted text', async ({ backgroundSW }) => {
      await mockExplainResponse(backgroundSW);
      await content.goto();
      await content.highlightText('Photosynthesis');
      await expect(content.headerText).toContainText('Photosynthesis', { timeout: 5000 });
    });

    test('popup closes on Escape key', async ({ backgroundSW }) => {
      await mockExplainResponse(backgroundSW);
      await content.goto();
      await content.highlightText('Photosynthesis');
      await expect(content.popupHost).toBeVisible({ timeout: 5000 });
      await content.page.keyboard.press('Escape');
      await expect(content.popupHost).not.toBeVisible({ timeout: 3000 });
    });

    test('API error shows error state', async ({ backgroundSW }) => {
      await mockExplainError(backgroundSW, 'Server error');
      await content.goto();
      await content.highlightText('Photosynthesis');
      await expect(content.errorHeading).toBeVisible({ timeout: 5000 });
      await expect(content.errorDescription).toBeVisible();
    });
  });

  test.describe('Save toast — authenticated', () => {
    test.beforeEach(async ({ backgroundSW, context }) => {
      await injectAuthSession(backgroundSW);
      await mockExplainResponse(backgroundSW);
    });

    test('shows "Note saved" for authenticated user', async ({ context }) => {
      const page = context.pages().at(-1)!;
      await mockSupabaseNotes(page);
      content = new ContentPage(page);
      await content.goto();
      await content.highlightText('Photosynthesis');
      await expect(content.savedToast).toBeVisible({ timeout: 10000 });
    });

    test('shows undo button', async ({ context }) => {
      const page = context.pages().at(-1)!;
      await mockSupabaseNotes(page);
      content = new ContentPage(page);
      await content.goto();
      await content.highlightText('Photosynthesis');
      await expect(content.undoButton).toBeVisible({ timeout: 10000 });
    });

    test('save error shows retry', async ({ context }) => {
      const page = context.pages().at(-1)!;
      await mockSupabaseNotesError(page, 500);
      content = new ContentPage(page);
      await content.goto();
      await content.highlightText('Photosynthesis');
      await expect(content.retrySaveButton).toBeVisible({ timeout: 10000 });
      await expect(content.saveErrorText).toBeVisible();
    });
  });

  test.describe('Save toast — unauthenticated', () => {
    test('shows sign in to save prompt', async ({ backgroundSW }) => {
      await mockExplainResponse(backgroundSW);
      await content.goto();
      await content.highlightText('Photosynthesis');
      await expect(content.signInToSaveText).toBeVisible({ timeout: 10000 });
      await expect(content.loginToSaveButton).toBeVisible();
    });
  });
});
