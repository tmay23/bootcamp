import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { WebLLMConfig, ProviderStatus, ConversationMessage } from '../../types/browser.types';
import { LocatorHelper } from './locator-helper';
import { SessionManager } from './session-manager';
import * as path from 'path';
import * as fs from 'fs';

export abstract class BaseWebLLM {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  protected config: WebLLMConfig;
  protected status: ProviderStatus;

  constructor(config: WebLLMConfig) {
    this.config = config;
    this.status = {
      provider: config.name,
      status: 'ok',
      sessionHealthy: false,
    };
  }

  /**
   * Initialize browser and restore session
   */
  async initialize(): Promise<void> {
    console.log(`🚀 Initializing ${this.config.name}...`);

    // Create persistent user data directory for this provider
    const userDataDir = path.join(process.cwd(), 'browser-profiles', this.config.name);

    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
      console.log(`📁 Created browser profile directory: ${userDataDir}`);
    } else {
      console.log(`📂 Using existing browser profile: ${userDataDir}`);
    }

    // Launch browser with persistent profile
    // This saves EVERYTHING: cookies, cache, localStorage, IndexedDB, etc.
    this.context = await chromium.launchPersistentContext(userDataDir, {
      headless: this.config.headless ?? false,
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
      // Additional anti-detection
      ignoreDefaultArgs: ['--enable-automation'],
      bypassCSP: true,
    });

    // Anti-detection: Add webdriver override to all new pages
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Additional anti-detection
      (window.navigator as any).chrome = {
        runtime: {},
      };

      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    // Check if page already exists (persistent context might have pages from previous session)
    const pages = this.context.pages();
    if (pages.length > 0) {
      console.log(`📄 Reusing existing page from persistent context`);
      this.page = pages[0];

      // Check current URL
      const currentUrl = this.page.url();
      console.log(`   Current URL: ${currentUrl}`);

      // If we're already at the target URL (or a chat page), don't navigate
      if (currentUrl.includes(new URL(this.config.url).hostname)) {
        console.log(`   ✅ Already at ${this.config.name}, skipping navigation`);
      } else {
        console.log(`   🔄 Navigating to ${this.config.url}...`);
        await this.page.goto(this.config.url, {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
      }
    } else {
      console.log(`📄 Creating new page`);
      this.page = await this.context.newPage();
      await this.page.goto(this.config.url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    }

    // Set longer timeout for slow sites
    this.page.setDefaultTimeout(60000); // 60 seconds

    // Wait a bit for page to stabilize
    await this.page.waitForTimeout(2000);

    // Check session health
    const isHealthy = await this.checkSessionHealth();
    this.status.sessionHealthy = isHealthy;

    if (!isHealthy) {
      console.log(`⚠️  ${this.config.name} requires login`);
      this.status.status = 'login_required';
    } else {
      console.log(`✅ ${this.config.name} session healthy`);
      this.status.status = 'ok';
    }
  }

  /**
   * Check if currently logged in
   */
  async checkSessionHealth(): Promise<boolean> {
    if (!this.page) {
      console.log(`❌ ${this.config.name}: No page available for health check`);
      return false;
    }

    try {
      console.log(`🔍 ${this.config.name}: Checking session health...`);

      // Check for login indicator (means NOT logged in)
      if (this.config.domProfile.loginIndicator) {
        const hasLoginPage = await LocatorHelper.exists(
          this.page,
          this.config.domProfile.loginIndicator
        );
        if (hasLoginPage) {
          console.log(`❌ ${this.config.name}: Login page detected - NOT logged in`);
          return false;
        } else {
          console.log(`✅ ${this.config.name}: No login page detected`);
        }
      }

      // Check for chat input (means logged in)
      console.log(`🔍 ${this.config.name}: Looking for chat input...`);
      const hasChatInput = await LocatorHelper.exists(
        this.page,
        this.config.domProfile.chatInput
      );

      if (hasChatInput) {
        console.log(`✅ ${this.config.name}: Chat input found - session is HEALTHY`);
      } else {
        console.log(`❌ ${this.config.name}: Chat input NOT found - session unhealthy`);
      }

      return hasChatInput;
    } catch (error) {
      console.error(`❌ ${this.config.name}: Error checking session health:`, error);
      return false;
    }
  }

  /**
   * Wait for user to manually login
   */
  async waitForManualLogin(timeoutMs: number = 300000): Promise<boolean> {
    console.log(`\n⏸️  Please log in to ${this.config.name} in the browser window...`);

    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      await this.page!.waitForTimeout(2000);

      const isHealthy = await this.checkSessionHealth();

      if (isHealthy) {
        console.log(`✅ Login successful for ${this.config.name}!`);
        console.log(`💾 Session automatically saved to persistent profile`);

        this.status.sessionHealthy = true;
        this.status.status = 'ok';
        return true;
      }
    }

    console.log(`❌ Login timeout for ${this.config.name}`);
    this.status.status = 'login_required';
    return false;
  }

  /**
   * Send prompt and get response
   */
  async query(prompt: string): Promise<string> {
    console.log(`\n📤 ${this.config.name}: Starting query...`);
    console.log(`   Prompt: "${prompt.substring(0, 60)}..."`);

    if (!this.page) {
      throw new Error(`${this.config.name} not initialized`);
    }

    if (!this.status.sessionHealthy) {
      console.log(`❌ ${this.config.name}: Cannot query - session not healthy!`);
      throw new Error(`${this.config.name} requires login`);
    }

    try {
      console.log(`⌨️  ${this.config.name}: Typing prompt...`);
      // Type the prompt with human-like behavior
      await this.typeHumanLike(prompt);

      console.log(`📨 ${this.config.name}: Sending message...`);
      // Send the message
      await this.sendMessage();

      // Wait for response
      const response = await this.waitForResponse();

      this.status.lastSuccess = Date.now();
      this.status.status = 'ok';

      return response;
    } catch (error) {
      this.status.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.status.status = 'error';
      throw error;
    }
  }

  /**
   * Type with random delays like a human
   */
  protected async typeHumanLike(text: string): Promise<void> {
    const input = await LocatorHelper.locate(this.page!, this.config.domProfile.chatInput);

    await input.click();
    await this.page!.waitForTimeout(this.randomDelay(300, 800));

    // For contenteditable divs, use fill() for speed, then add natural delay
    // For regular inputs, use character-by-character typing
    try {
      // Try fast fill first (works for contenteditable)
      await input.fill(text);
      await this.page!.waitForTimeout(this.randomDelay(500, 1500));
    } catch (error) {
      // Fallback: type character by character (for inputs/textareas)
      for (const char of text) {
        await input.type(char);
        await this.page!.waitForTimeout(this.randomDelay(50, 200));
      }
      await this.page!.waitForTimeout(this.randomDelay(500, 1500));
    }
  }

  /**
   * Send the message
   */
  protected async sendMessage(): Promise<void> {
    let sent = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!sent && attempts < maxAttempts) {
      attempts++;
      try {
        // Try to find and click send button
        if (this.config.domProfile.sendButton) {
          try {
            const sendBtn = await LocatorHelper.locate(
              this.page!,
              this.config.domProfile.sendButton
            );
            await sendBtn.click();
            console.log(`✅ Clicked send button`);
            sent = true;
          } catch (error) {
            // Fallback: Press Enter if button not found
            console.log(`⚠️ Send button not found (attempt ${attempts}/${maxAttempts}), using Enter key`);
            await this.page!.keyboard.press('Enter');
            sent = true;
          }
        } else {
          // No send button defined, use Enter
          await this.page!.keyboard.press('Enter');
          sent = true;
        }
      } catch (error) {
        console.error(`❌ Send attempt ${attempts} failed:`, error);
        if (attempts < maxAttempts) {
          await this.page!.waitForTimeout(1000);
        }
      }
    }

    if (!sent) {
      throw new Error('Failed to send message after multiple attempts');
    }

    await this.page!.waitForTimeout(this.randomDelay(1000, 2000));
  }

  /**
   * Wait for response to complete (must be implemented by each provider)
   */
  protected abstract waitForResponse(): Promise<string>;

  /**
   * Get conversation history
   */
  abstract getHistory(): Promise<ConversationMessage[]>;

  /**
   * Take screenshot for evidence
   */
  async takeScreenshot(name: string): Promise<string> {
    if (!this.page) return '';

    const screenshotDir = path.join(process.cwd(), 'data', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const filename = `${this.config.name}_${name}_${Date.now()}.png`;
    const filepath = path.join(screenshotDir, filename);

    await this.page.screenshot({ path: filepath, fullPage: true });

    return filepath;
  }

  /**
   * Random delay helper
   */
  protected randomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get current status
   */
  getStatus(): ProviderStatus {
    return this.status;
  }

  /**
   * Cleanup - closes browser but session is auto-saved to persistent profile
   */
  async close(): Promise<void> {
    console.log(`🛑 Closing ${this.config.name} browser...`);

    if (this.context) {
      // Persistent context auto-saves all data (cookies, localStorage, etc.)
      await this.context.close();
      console.log(`✅ ${this.config.name} browser closed, session preserved in profile`);
    }

    // No need to close browser separately - persistent context handles it
    this.browser = null;
    this.context = null;
    this.page = null;
  }
}
