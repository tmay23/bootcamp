// Browser automation types
export interface ProviderStatus {
  provider: string;
  status: 'ok' | 'login_required' | 'timeout' | 'error' | 'rate_limited';
  lastSuccess?: number;
  lastError?: string;
  sessionHealthy: boolean;
}

export interface LocatorStrategy {
  type: 'role' | 'text' | 'css' | 'xpath' | 'testid';
  value: string;
  required?: boolean;
}

export interface LocatorSpec {
  description: string;
  strategies: LocatorStrategy[];
}

export interface ProviderDOMProfile {
  version: string;
  chatInput: LocatorSpec;
  sendButton?: LocatorSpec;
  lastAssistantMessage: LocatorSpec;
  messageContainer: LocatorSpec;
  loginIndicator?: LocatorSpec;
  captchaIndicator?: LocatorSpec;
  stopGeneratingButton?: LocatorSpec;
}

export interface WebLLMConfig {
  name: string;
  url: string;
  sessionPath: string;
  domProfile: ProviderDOMProfile;
  headless?: boolean;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Iterative analysis types
export interface Contradiction {
  topic: string;
  views: Record<string, string>;
  severity: 'low' | 'medium' | 'high';
}

export interface Gap {
  description: string;
  importance: 'low' | 'medium' | 'high';
}

export interface RoundAnalysis {
  roundNumber: number;
  agreements: string[];
  contradictions: Contradiction[];
  gaps: Gap[];
  uniqueInsights: { provider: string; insight: string }[];
  confidence: number;
  completeness: number;
}

export interface FollowUpQuestion {
  question: string;
  reason: string;
  targetProviders?: string[];
}

export interface ProviderResult {
  provider: string;
  status: 'ok' | 'timeout' | 'error' | 'login_required';
  response?: string;
  error?: string;
  timestamp: number;
  screenshot?: string;
  rawHtml?: string;
}

export interface RoundState {
  index: number;
  prompt: string;
  providerResults: ProviderResult[];
  analysis: RoundAnalysis | null;
  followUpQuestions?: FollowUpQuestion[];
}

export interface RunState {
  id: string;
  userPrompt: string;
  rounds: RoundState[];
  providerStatuses: Record<string, ProviderStatus>;
  finalSynthesis?: IterativeSynthesisResult;
  createdAt: number;
  completedAt?: number;
}

export interface IterativeSynthesisResult {
  synthesizedAnswer: string;
  confidenceEvolution: number[];
  resolvedContradictions: Contradiction[];
  unresolvedContradictions: Contradiction[];
  keyFindings: string[];
  providerReliability: Record<string, number>;
  rounds: RoundState[];
  metadata: {
    totalRounds: number;
    successfulProviders: number[];
    totalTime: number;
  };
}

export interface IterativeConfig {
  maxRounds: number;
  convergenceThreshold: number;
  focusAreas: ('accuracy' | 'depth' | 'examples')[];
  challengeMode: boolean;
  fillGaps: boolean;
  adaptiveRounds: boolean;
}
