import type { Page } from '@playwright/test';

const TEST_PAGE_HTML = `
<!DOCTYPE html>
<html>
<head><title>E2E Test Page</title></head>
<body>
  <p id="test-text">Photosynthesis is the process by which plants convert sunlight into energy.
  This fundamental biological process is essential for life on Earth and involves
  the absorption of carbon dioxide and water to produce glucose and oxygen.</p>
</body>
</html>
`;

export class ContentPage {
  constructor(public readonly page: Page) {}

  async goto() {
    // Navigate to a real URL so the content script's <all_urls> match pattern triggers.
    // setContent() uses about:blank which doesn't match any content script patterns.
    await this.page.goto('https://example.com');
    // Replace body with our test content
    await this.page.evaluate((html) => {
      document.body.innerHTML = html;
    }, '<p id="test-text">Photosynthesis is the process by which plants convert sunlight into energy. This fundamental biological process is essential for life on Earth and involves the absorption of carbon dioxide and water to produce glucose and oxygen.</p>');
    // Wait for content script to inject
    await this.page.waitForTimeout(2000);
  }

  async gotoUrl(url: string) {
    await this.page.goto(url);
    await this.page.waitForTimeout(1000);
  }

  /** Select text on the page by triple-clicking the test paragraph */
  async highlightText(text?: string) {
    if (text) {
      // Select specific text by finding it and using mouse to select
      const textHandle = await this.page.evaluateHandle((t) => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const idx = node.textContent?.indexOf(t) ?? -1;
          if (idx >= 0) {
            const range = document.createRange();
            range.setStart(node, idx);
            range.setEnd(node, idx + t.length);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
            return node.parentElement;
          }
        }
        return null;
      }, text);

      // Trigger mouseup to activate content script
      const element = textHandle.asElement();
      if (element) {
        const box = await element.boundingBox();
        if (box) {
          await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          // Re-select after click (click clears selection)
          await this.page.evaluate((t) => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              const node = walker.currentNode;
              const idx = node.textContent?.indexOf(t) ?? -1;
              if (idx >= 0) {
                const range = document.createRange();
                range.setStart(node, idx);
                range.setEnd(node, idx + t.length);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
                break;
              }
            }
          }, text);
          // Dispatch mouseup to trigger content script handler
          await this.page.dispatchEvent('#test-text', 'mouseup', { bubbles: true });
        }
      }
    } else {
      // Select all text in the paragraph
      await this.page.click('#test-text', { clickCount: 3 });
      // mouseup is automatically fired after click
    }
  }

  /** Shadow DOM locator for the bubb popup - checks for the visible card, not just the host */
  get popupHost() {
    return this.page.locator('bubb-popup').locator('.rounded-\\[12px\\]');
  }

  /** Locator inside the shadow root */
  private shadowLocator(selector: string) {
    return this.page.locator(`bubb-popup >> ${selector}`);
  }

  get popup() {
    return this.shadowLocator('.rounded-\\[12px\\]');
  }

  get skeletonLoader() {
    return this.shadowLocator('.animate-pulse').first();
  }

  get explanationText() {
    // Body explanation: inside the overflow-y-auto container, not the header
    return this.shadowLocator('.overflow-y-auto p[style*="DM Sans"]');
  }

  get headerText() {
    return this.shadowLocator('p.font-semibold').first();
  }

  get closeButton() {
    return this.shadowLocator('button[aria-label="Close explanation"]');
  }

  get errorHeading() {
    return this.shadowLocator('text=Something went wrong');
  }

  get errorDescription() {
    return this.shadowLocator('text=Could not get an explanation');
  }

  // Save toast
  get savedToast() {
    return this.shadowLocator('text=Note saved');
  }

  get undoButton() {
    return this.shadowLocator('text=Undo save');
  }

  get signInToSaveText() {
    return this.shadowLocator('text=Sign in to save notes');
  }

  get loginToSaveButton() {
    return this.shadowLocator('text=Log in to save');
  }

  get retrySaveButton() {
    return this.shadowLocator('text=Retry save');
  }

  get saveErrorText() {
    return this.shadowLocator('text=Could not save note');
  }
}
