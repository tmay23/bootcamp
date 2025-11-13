import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIResponse } from '../../types';

export class GeminiService {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async query(prompt: string): Promise<AIResponse> {
    const startTime = Date.now();
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const content = response.text();

      return {
        provider: 'gemini',
        content,
        timestamp: Date.now() - startTime,
      };
    } catch (error) {
      return {
        provider: 'gemini',
        content: '',
        timestamp: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
