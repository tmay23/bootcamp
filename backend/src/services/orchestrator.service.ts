import { ClaudeService } from './ai-clients/claude.service';
import { OpenAIService } from './ai-clients/openai.service';
import { GeminiService } from './ai-clients/gemini.service';
import { GrokService } from './ai-clients/grok.service';
import { AIResponse } from '../types';

export class OrchestratorService {
  private claudeService?: ClaudeService;
  private openaiService?: OpenAIService;
  private geminiService?: GeminiService;
  private grokService?: GrokService;

  constructor() {
    // Initialize services if API keys are available
    if (process.env.ANTHROPIC_API_KEY) {
      this.claudeService = new ClaudeService(process.env.ANTHROPIC_API_KEY);
    }
    if (process.env.OPENAI_API_KEY) {
      this.openaiService = new OpenAIService(process.env.OPENAI_API_KEY);
    }
    if (process.env.GOOGLE_API_KEY) {
      this.geminiService = new GeminiService(process.env.GOOGLE_API_KEY);
    }
    if (process.env.GROK_API_KEY) {
      this.grokService = new GrokService(process.env.GROK_API_KEY);
    }
  }

  async queryAll(
    prompt: string,
    providers?: Array<'claude' | 'openai' | 'gemini' | 'grok'>
  ): Promise<AIResponse[]> {
    const queries: Promise<AIResponse>[] = [];

    // Determine which providers to use
    const useProviders = providers || ['claude', 'openai', 'gemini', 'grok'];

    // Add queries for available services
    if (useProviders.includes('claude') && this.claudeService) {
      queries.push(this.claudeService.query(prompt));
    }
    if (useProviders.includes('openai') && this.openaiService) {
      queries.push(this.openaiService.query(prompt));
    }
    if (useProviders.includes('gemini') && this.geminiService) {
      queries.push(this.geminiService.query(prompt));
    }
    if (useProviders.includes('grok') && this.grokService) {
      queries.push(this.grokService.query(prompt));
    }

    // Execute all queries in parallel
    const results = await Promise.all(queries);

    return results;
  }

  async queryWithIterations(
    prompt: string,
    iterations: number = 1,
    providers?: Array<'claude' | 'openai' | 'gemini' | 'grok'>
  ): Promise<AIResponse[][]> {
    const allIterations: AIResponse[][] = [];

    for (let i = 0; i < iterations; i++) {
      const results = await this.queryAll(prompt, providers);
      allIterations.push(results);
    }

    return allIterations;
  }

  getAvailableProviders(): string[] {
    const providers: string[] = [];
    if (this.claudeService) providers.push('claude');
    if (this.openaiService) providers.push('openai');
    if (this.geminiService) providers.push('gemini');
    if (this.grokService) providers.push('grok');
    return providers;
  }
}
