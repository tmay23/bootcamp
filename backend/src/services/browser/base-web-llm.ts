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

    // Launch browser
    this.browser = await chromium.launch({
      headless: this.config.headless ?? false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    // Try to load existing session
    const sessionPath = SessionManager.getSessionPath(this.config.name);
    const contextOptions: any = {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
    };

    if (fs.existsSync(sessionPath)) {
      console.log(`📂 Loading existing session for ${this.config.name}`);
      contextOptions.storageState = sessionPath;
    }

    this.context = await this.browser.newContext(contextOptions);

    // Anti-detection: Add webdriver override
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    this.page = await this.context.newPage();

    // Set longer timeout for slow sites
    this.page.setDefaultTimeout(60000); // 60 seconds

    // Navigate to provider with increased timeout
    await this.page.goto(this.config.url, {
      waitUntil: 'domcontentloaded', // Less strict than networkidle
      timeout: 60000 // 60 seconds
    });

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

        // Save session
        await this.saveSession();

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
   * Save current session state
   */
  async saveSession(): Promise<void> {
    if (!this.context) return;

    const sessionPath = SessionManager.getSessionPath(this.config.name);
    await this.context.storageState({ path: sessionPath });
    console.log(`💾 Saved session for ${this.config.name}`);
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
   * Cleanup
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.saveSession();
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}
