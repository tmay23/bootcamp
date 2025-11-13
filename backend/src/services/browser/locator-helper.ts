import { Page, Locator } from 'playwright';
import { LocatorSpec, LocatorStrategy } from '../../types/browser.types';

export class LocatorHelper {
  /**
   * Tries multiple locator strategies in order until one succeeds
   * Now with retry logic and better timeout handling
   */
  static async locate(page: Page, spec: LocatorSpec, retries: number = 3): Promise<Locator> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      for (const strategy of spec.strategies) {
        try {
          const locator = await this.getLocatorByStrategy(page, strategy);

          // Wait a bit for element to be in DOM
          await page.waitForTimeout(500);

          const count = await locator.count();

          if (count > 0) {
            // Verify element is actually interactable
            const isVisible = await locator.first().isVisible().catch(() => false);

            if (isVisible) {
              console.log(`✅ Found element using ${strategy.type}: ${strategy.value.substring(0, 50)}`);
              return locator.first();
            }
          }
        } catch (error) {
          lastError = error as Error;
          // Strategy failed, try next one
          continue;
        }
      }

      // If we're not on the last retry, wait before trying again
      if (attempt < retries) {
        console.log(`⚠️  Element not found (${spec.description}), retrying (${attempt}/${retries})...`);
        await page.waitForTimeout(1000 * attempt); // Exponential backoff
      }
    }

    // All strategies and retries failed
    throw new Error(
      `Cannot locate element: ${spec.description}. Tried ${spec.strategies.length} strategies with ${retries} retries. Last error: ${lastError?.message || 'Unknown'}`
    );
  }

  private static async getLocatorByStrategy(
    page: Page,
    strategy: LocatorStrategy
  ): Promise<Locator> {
    switch (strategy.type) {
      case 'role':
        return page.getByRole(strategy.value as any);

      case 'text':
        return page.getByText(strategy.value);

      case 'css':
        return page.locator(strategy.value);

      case 'xpath':
        return page.locator(strategy.value);

      case 'testid':
        return page.getByTestId(strategy.value);

      default:
        throw new Error(`Unknown strategy type: ${strategy.type}`);
    }
  }

  /**
   * Checks if an element exists without throwing error
   */
  static async exists(page: Page, spec: LocatorSpec): Promise<boolean> {
    try {
      const locator = await this.locate(page, spec);
      return (await locator.count()) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Waits for element to appear with timeout
   */
  static async waitFor(
    page: Page,
    spec: LocatorSpec,
    timeout: number = 10000
  ): Promise<Locator> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const locator = await this.locate(page, spec);
        if (await locator.isVisible()) {
          return locator;
        }
      } catch {
        // Element not found yet
      }

      await page.waitForTimeout(500);
    }

    throw new Error(`Timeout waiting for: ${spec.description}`);
  }
}
