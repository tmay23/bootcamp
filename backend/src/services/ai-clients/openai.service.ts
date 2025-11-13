import OpenAI from 'openai';
import { AIResponse } from '../../types';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async query(prompt: string): Promise<AIResponse> {
    const startTime = Date.now();
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 4096,
      });

      const content = completion.choices[0]?.message?.content || '';

      return {
        provider: 'openai',
        content,
        timestamp: Date.now() - startTime,
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error) {
      return {
        provider: 'openai',
        content: '',
        timestamp: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
