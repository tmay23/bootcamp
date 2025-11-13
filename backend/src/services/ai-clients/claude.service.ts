import Anthropic from '@anthropic-ai/sdk';
import { AIResponse } from '../../types';

export class ClaudeService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async query(prompt: string): Promise<AIResponse> {
    const startTime = Date.now();
    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0].type === 'text' ? message.content[0].text : '';

      return {
        provider: 'claude',
        content,
        timestamp: Date.now() - startTime,
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      };
    } catch (error) {
      return {
        provider: 'claude',
        content: '',
        timestamp: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
