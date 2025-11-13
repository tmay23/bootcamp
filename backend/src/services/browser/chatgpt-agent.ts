import { BaseWebLLM } from './base-web-llm';
import { ChatGPTDOMProfile } from './dom-profiles';
import { LocatorHelper } from './locator-helper';
import { ConversationMessage } from '../../types/browser.types';

export class ChatGPTAgent extends BaseWebLLM {
  constructor(headless: boolean = false) {
    super({
      name: 'chatgpt',
      url: 'https://chat.openai.com/',
      sessionPath: 'chatgpt.json',
      domProfile: ChatGPTDOMProfile,
      headless,
    });
  }

  /**
   * Wait for ChatGPT response to complete
   * Uses MutationObserver + polling strategy
   */
  protected async waitForResponse(): Promise<string> {
    const maxWait = 120000; // 2 minutes max
    const startTime = Date.now();
    let lastContent = '';
    let stableCount = 0;
    const requiredStableChecks = 4; // Content must be stable for 4 checks (2 seconds)

    console.log(`⏳ Waiting for ChatGPT response...`);

    while (Date.now() - startTime < maxWait) {
      try {
        // Check if "Stop generating" button is present (still streaming)
        const isStreaming = this.config.domProfile.stopGeneratingButton
          ? await LocatorHelper.exists(this.page!, this.config.domProfile.stopGeneratingButton)
          : false;

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

          // Check if content has stabilized
          if (currentContent === lastContent) {
            stableCount++;
          } else {
            stableCount = 0;
            lastContent = currentContent;
            console.log(`📝 Content updated: ${currentContent.length} chars`);
          }

          // If not streaming and content is stable, we're done
          if (!isStreaming && stableCount >= requiredStableChecks) {
            console.log(`✅ ChatGPT response complete (${currentContent.length} chars)`);

            // Take evidence screenshot
            await this.takeScreenshot('response');

            // Get raw HTML for backup
            const rawHtml = await messageLocator.innerHTML();
            console.log(`📝 Captured raw HTML (${rawHtml.length} chars)`);

            return currentContent.trim();
          }
        }

        // Wait before next check
        await this.page!.waitForTimeout(500);
      } catch (error) {
        console.error('Error waiting for response:', error);
        await this.page!.waitForTimeout(1000);
      }
    }

    throw new Error('Timeout waiting for ChatGPT response');
  }

  /**
   * Get conversation history
   */
  async getHistory(): Promise<ConversationMessage[]> {
    // This would require more complex DOM traversal
    // For now, return empty array
    return [];
  }

  /**
   * Start a new conversation
   */
  async startNewConversation(): Promise<void> {
    // Look for "New chat" button
    try {
      const newChatButton = await this.page!.locator('a:has-text("New chat")').first();
      if (await newChatButton.isVisible()) {
        await newChatButton.click();
        await this.page!.waitForTimeout(this.randomDelay(1000, 2000));
        console.log(`🆕 Started new ChatGPT conversation`);
      }
    } catch (error) {
      console.log('⚠️  Could not find "New chat" button');
    }
  }
}
