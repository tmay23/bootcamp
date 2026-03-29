export interface AIResponse {
  provider: 'claude' | 'openai' | 'gemini' | 'grok';
  content: string;
  timestamp: number;
  tokensUsed?: number;
  error?: string;
}

export interface SynthesisResult {
  synthesizedAnswer: string;
  individualResponses: AIResponse[];
  analysis: {
    commonThemes: string[];
    uniqueInsights: { provider: string; insight: string }[];
    confidence: number;
  };
  metadata: {
    totalProviders: number;
    successfulProviders: number;
    totalTime: number;
  };
}

export interface AIClientConfig {
  apiKey: string;
  model?: string;
}

export interface QueryRequest {
  prompt: string;
  iterations?: number;
  providers?: Array<'claude' | 'openai' | 'gemini' | 'grok'>;
}
