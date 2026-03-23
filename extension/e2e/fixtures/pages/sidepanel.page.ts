import type { Page } from '@playwright/test';

export class SidePanelPage {
  constructor(
    private page: Page,
    private extensionId: string,
  ) {}

  async goto() {
    await this.page.goto(`chrome-extension://${this.extensionId}/sidepanel.html`);
  }

  // Signed out view
  get learnLabel() {
    return this.page.getByText('[ LEARN ]');
  }

  get heading() {
    return this.page.getByRole('heading', { name: /understand anything/i });
  }

  get continueWithGoogleButton() {
    return this.page.getByRole('button', { name: /continue with google/i });
  }

  get featureCardExplain() {
    return this.page.getByText('[ EXPLAIN ]');
  }

  get featureCardSave() {
    return this.page.getByText('[ SAVE ]');
  }

  get signingInText() {
    return this.page.getByText('Signing in...');
  }

  // Signed in view
  get dashboardLabel() {
    return this.page.getByText('[ DASHBOARD ]');
  }

  greeting(name: string) {
    return this.page.getByRole('heading', { name: new RegExp(`Hey, ${name}`, 'i') });
  }

  get initialsAvatar() {
    return this.page.locator('.rounded-full');
  }

  get statsGrid() {
    return this.page.locator('.grid-cols-3');
  }

  get notesStatLabel() {
    return this.page.getByText('NOTES', { exact: true });
  }

  get topicsStatLabel() {
    return this.page.getByText('TOPICS', { exact: true });
  }

  get pagesStatLabel() {
    return this.page.getByText('PAGES', { exact: true });
  }

  // Action cards
  get explainActionCard() {
    return this.page.getByText('Start learning');
  }

  get notesActionCard() {
    return this.page.getByText('Your notes');
  }

  get topicsActionCard() {
    return this.page.getByText('Topics');
  }

  // Sign out
  get signOutButton() {
    return this.page.getByRole('button', { name: /sign out/i }).first();
  }

  get signOutConfirmText() {
    return this.page.getByText('Sign out of bubb?');
  }

  get signOutConfirmButton() {
    return this.page.getByRole('button', { name: /^sign out$/i });
  }

  get signOutCancelButton() {
    return this.page.getByRole('button', { name: /cancel/i });
  }

  // Auth error
  get authErrorBanner() {
    return this.page.locator('[class*="slideDown"]').first();
  }

  get authErrorRetryButton() {
    return this.page.getByRole('button', { name: /try again/i });
  }

  get authErrorDismissButton() {
    return this.page.getByLabel('Dismiss error');
  }
}
