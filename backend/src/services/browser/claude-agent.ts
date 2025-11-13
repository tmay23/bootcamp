import { BaseWebLLM } from './base-web-llm';
import { ClaudeDOMProfile } from './dom-profiles';
import { LocatorHelper } from './locator-helper';
import { ConversationMessage } from '../../types/browser.types';

export class ClaudeAgent extends BaseWebLLM {
  constructor(headless: boolean = false) {
    super({
      name: 'claude',
      url: 'https://claude.ai/chats', // Start at chats page, not root
      sessionPath: 'claude.json',
      domProfile: ClaudeDOMProfile,
      headless,
    });
  }

  /**
   * Wait for Claude response to complete
   * Claude uses data-is-streaming attribute
   */
  protected async waitForResponse(): Promise<string> {
    const maxWait = 120000; // 2 minutes
    const startTime = Date.now();
    let lastContent = '';
    let stableCount = 0;
    const requiredStableChecks = 4;

    console.log(`⏳ Waiting for Claude response...`);

    while (Date.now() - startTime < maxWait) {
      try {
        // Check for stop button (indicates streaming)
        const isStreaming = this.config.domProfile.stopGeneratingButton
          ? await LocatorHelper.exists(this.page!, this.config.domProfile.stopGeneratingButton)
          : false;

        // Alternatively, check data-is-streaming attribute
        const streamingElements = await this.page!.locator('[data-is-streaming="true"]').count();
        const actuallyStreaming = isStreaming || streamingElements > 0;

        // Get latest message
        const messageLocator = await LocatorHelper.locate(
          this.page!,
          this.config.domProfile.lastAssistantMessage
        );

        const currentContent = await messageLocator.textContent();

        if (currentContent) {
          // Ignore if response is suspiciously short (likely error or loading)
          if (currentContent.trim().length < 50) {
            console.log(`⚠️ Response too short (${currentContent.trim().length} chars), waiting...`);
            await this.page!.waitForTimeout(2000);
            continue;
          }

          if (currentContent === lastContent) {
            stableCount++;
          } else {
            stableCount = 0;
            lastContent = currentContent;
            console.log(`📝 Content updated: ${currentContent.length} chars`);
          }

          // Response complete when not streaming and content stable
          if (!actuallyStreaming && stableCount >= requiredStableChecks) {
            console.log(`✅ Claude response complete (${currentContent.length} chars)`);

            // Take screenshot
            await this.takeScreenshot('response');

            // Get raw HTML including artifacts
            const rawHtml = await messageLocator.innerHTML();
            console.log(`📝 Captured raw HTML (${rawHtml.length} chars)`);

            return currentContent.trim();
          }
        }

        await this.page!.waitForTimeout(500);
      } catch (error) {
        console.error('Error waiting for Claude response:', error);
        await this.page!.waitForTimeout(1000);
      }
    }

    throw new Error('Timeout waiting for Claude response');
  }

  /**
   * Get conversation history
   */
  async getHistory(): Promise<ConversationMessage[]> {
    // Implementation would require traversing all messages
    return [];
  }

  /**
   * Start new conversation
   */
  async startNewConversation(): Promise<void> {
    try {
      // Look for "New chat" or similar button
      const newChatButton = await this.page!.locator('button:has-text("Start new chat")').first();
      if (await newChatButton.isVisible()) {
        await newChatButton.click();
        await this.page!.waitForTimeout(this.randomDelay(1000, 2000));
        console.log(`🆕 Started new Claude conversation`);
      }
    } catch (error) {
      // Navigate to base URL as fallback
      await this.page!.goto('https://claude.ai/new');
      await this.page!.waitForTimeout(this.randomDelay(2000, 3000));
      console.log(`🆕 Navigated to new Claude conversation`);
    }
  }
}
