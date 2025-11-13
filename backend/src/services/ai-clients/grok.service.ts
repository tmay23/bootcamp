import axios from 'axios';
import { AIResponse } from '../../types';

export class GrokService {
  private apiKey: string;
  private baseURL = 'https://api.x.ai/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async query(prompt: string): Promise<AIResponse> {
    const startTime = Date.now();
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'grok-beta',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 4096,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = response.data.choices[0]?.message?.content || '';

      return {
        provider: 'grok',
        content,
        timestamp: Date.now() - startTime,
        tokensUsed: response.data.usage?.total_tokens,
      };
    } catch (error) {
      return {
        provider: 'grok',
        content: '',
        timestamp: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
