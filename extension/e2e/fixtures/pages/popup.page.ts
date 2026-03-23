import type { Page } from '@playwright/test';

export class PopupPage {
  constructor(
    private page: Page,
    private extensionId: string,
  ) {}

  async goto() {
    await this.page.goto(`chrome-extension://${this.extensionId}/popup.html`);
  }

  get logo() {
    return this.page.locator('svg').first();
  }

  get signInLabel() {
    return this.page.getByText('[ SIGN IN ]');
  }

  get readyLabel() {
    return this.page.getByText('[ READY ]');
  }

  get signInButton() {
    return this.page.getByRole('button', { name: /sign in with google/i });
  }

  get sidePanelInstruction() {
    return this.page.getByText('Open the side panel');
  }
}
