import { Page, Locator } from 'playwright';
import { LocatorSpec, LocatorStrategy } from '../../types/browser.types';

export class LocatorHelper {
  /**
   * Tries multiple locator strategies in order until one succeeds
   */
  static async locate(page: Page, spec: LocatorSpec): Promise<Locator> {
    for (const strategy of spec.strategies) {
      try {
        const locator = await this.getLocatorByStrategy(page, strategy);
        const count = await locator.count();

        if (count > 0) {
          console.log(`✅ Found element using ${strategy.type}: ${strategy.value}`);
          return locator.first();
        }
      } catch (error) {
        // Strategy failed, try next one
        continue;
      }
    }

    // All strategies failed
    throw new Error(`Cannot locate element: ${spec.description}. Tried ${spec.strategies.length} strategies.`);
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
