import { ChatGPTAgent } from './chatgpt-agent';
import { ClaudeAgent } from './claude-agent';
import { BaseWebLLM } from './base-web-llm';
import { IterativeAnalyzer } from './iterative-analyzer';
import {
  RunState,
  RoundState,
  ProviderResult,
  IterativeConfig,
  IterativeSynthesisResult,
} from '../../types/browser.types';
import { v4 as uuidv4 } from 'uuid';

export class IterativeOrchestrator {
  private agents: Map<string, BaseWebLLM> = new Map();
  private analyzer: IterativeAnalyzer;
  private initialized: boolean = false;

  constructor() {
    this.analyzer = new IterativeAnalyzer();
  }

  /**
   * Initialize all available agents
   */
  async initialize(headless: boolean = false): Promise<void> {
    if (this.initialized) return;

    console.log('🚀 Initializing browser agents...\n');

    // Initialize ChatGPT
    try {
      const chatgpt = new ChatGPTAgent(headless);
      await chatgpt.initialize();

      if (!chatgpt.getStatus().sessionHealthy) {
        console.log('⏸️  ChatGPT requires manual login');
        const success = await chatgpt.waitForManualLogin();
        if (!success) {
          console.log('⚠️  ChatGPT login failed or timed out');
        }
      }

      this.agents.set('chatgpt', chatgpt);
    } catch (error) {
      console.error('❌ Failed to initialize ChatGPT:', error);
    }

    // Initialize Claude
    try {
      const claude = new ClaudeAgent(headless);
      await claude.initialize();

      if (!claude.getStatus().sessionHealthy) {
        console.log('⏸️  Claude requires manual login');
        const success = await claude.waitForManualLogin();
        if (!success) {
          console.log('⚠️  Claude login failed or timed out');
        }
      }

      this.agents.set('claude', claude);
    } catch (error) {
      console.error('❌ Failed to initialize Claude:', error);
    }

    this.initialized = true;

    const healthyAgents = Array.from(this.agents.values()).filter(
      (a) => a.getStatus().sessionHealthy
    );

    console.log(`\n✅ Initialized ${healthyAgents.length}/${this.agents.size} agents\n`);

    if (healthyAgents.length === 0) {
      throw new Error('No healthy agents available. Please check logins.');
    }
  }

  /**
   * Run iterative query with multiple rounds
   */
  async runIterativeQuery(
    userPrompt: string,
    config: IterativeConfig
  ): Promise<IterativeSynthesisResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const runState: RunState = {
      id: uuidv4(),
      userPrompt,
      rounds: [],
      providerStatuses: {},
      createdAt: Date.now(),
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 Starting iterative query: "${userPrompt.substring(0, 60)}..."`);
    console.log(`${'='.repeat(60)}\n`);

    let currentPrompt = userPrompt;

    // Run rounds
    for (let roundNum = 1; roundNum <= config.maxRounds; roundNum++) {
      console.log(`\n📍 ROUND ${roundNum}/${config.maxRounds}`);
      console.log(`Prompt: "${currentPrompt.substring(0, 80)}..."\n`);

      // Execute round
      const roundState = await this.executeRound(roundNum, currentPrompt);
      runState.rounds.push(roundState);

      // Analyze results
      if (roundState.analysis) {
        console.log(`\n📊 Round ${roundNum} Analysis:`);
        console.log(`  Confidence: ${roundState.analysis.confidence.toFixed(1)}%`);
        console.log(`  Completeness: ${roundState.analysis.completeness.toFixed(1)}%`);
        console.log(`  Agreements: ${roundState.analysis.agreements.length}`);
        console.log(`  Contradictions: ${roundState.analysis.contradictions.length}`);
        console.log(`  Gaps: ${roundState.analysis.gaps.length}`);

        // Check convergence
        if (
          config.adaptiveRounds &&
          roundState.analysis.confidence >= config.convergenceThreshold
        ) {
          console.log(`\n✅ Converged! Confidence threshold reached.`);
          break;
        }

        // Generate follow-up questions for next round
        if (roundNum < config.maxRounds) {
          const followUps = this.analyzer.generateFollowUpQuestions(roundState.analysis);

          if (followUps.length > 0) {
            console.log(`\n🔄 Generated ${followUps.length} follow-up questions`);
            roundState.followUpQuestions = followUps;

            // Use first follow-up for next round
            currentPrompt = followUps[0].question;
          } else if (roundState.analysis.confidence >= 85) {
            console.log(`\n✅ High confidence, stopping early`);
            break;
          }
        }
      }
    }

    runState.completedAt = Date.now();

    // Create final synthesis
    const finalSynthesis = this.createFinalSynthesis(runState);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Query complete in ${runState.rounds.length} rounds`);
    console.log(`Final confidence: ${finalSynthesis.confidenceEvolution[finalSynthesis.confidenceEvolution.length - 1].toFixed(1)}%`);
    console.log(`${'='.repeat(60)}\n`);

    return finalSynthesis;
  }

  /**
   * Execute a single round
   */
  private async executeRound(roundNumber: number, prompt: string): Promise<RoundState> {
    const providerResults: ProviderResult[] = [];

    // Query all healthy agents in parallel
    const healthyAgents = Array.from(this.agents.entries()).filter(([_, agent]) =>
      agent.getStatus().sessionHealthy
    );

    console.log(`Querying ${healthyAgents.length} providers...`);

    const queryPromises = healthyAgents.map(async ([name, agent]) => {
      const startTime = Date.now();

      try {
        console.log(`  ⏳ ${name}: Waiting for response...`);
        const response = await Promise.race([
          agent.query(prompt),
          this.timeout(90000, `${name} timeout`),
        ]);

        const result: ProviderResult = {
          provider: name,
          status: 'ok',
          response: response as string,
          timestamp: Date.now() - startTime,
        };

        console.log(`  ✅ ${name}: Complete (${result.timestamp}ms, ${response?.length || 0} chars)`);
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        console.log(`  ❌ ${name}: Failed - ${errorMsg}`);

        return {
          provider: name,
          status: errorMsg.includes('timeout') ? 'timeout' : 'error',
          error: errorMsg,
          timestamp: Date.now() - startTime,
        } as ProviderResult;
      }
    });

    // Wait for all queries to complete
    const results = await Promise.all(queryPromises);
    providerResults.push(...results);

    // Analyze round
    const previousAnalysis = roundNumber > 1 ? this.getLastRound()?.analysis : null;

    const analysis = previousAnalysis
      ? this.analyzer.analyzeRound(roundNumber, providerResults, previousAnalysis)
      : this.analyzer.analyzeRound1(providerResults);

    return {
      index: roundNumber,
      prompt,
      providerResults,
      analysis,
    };
  }

  /**
   * Create final synthesis from all rounds
   */
  private createFinalSynthesis(runState: RunState): IterativeSynthesisResult {
    const confidenceEvolution = runState.rounds.map((r) => r.analysis?.confidence || 0);

    // Collect all successful responses
    const allResponses = runState.rounds.flatMap((r) =>
      r.providerResults.filter((pr) => pr.status === 'ok' && pr.response)
    );

    // Synthesize final answer
    const synthesizedAnswer = this.synthesizeAnswer(runState.rounds);

    // Find resolved vs unresolved contradictions
    const allContradictions = runState.rounds.flatMap((r) => r.analysis?.contradictions || []);
    const lastRoundContradictions = runState.rounds[runState.rounds.length - 1].analysis?.contradictions || [];

    const resolvedContradictions = allContradictions.filter(
      (c) => !lastRoundContradictions.some((lc) => lc.topic === c.topic)
    );

    // Extract key findings (top agreements from final round)
    const keyFindings = runState.rounds[runState.rounds.length - 1].analysis?.agreements || [];

    // Calculate provider reliability
    const providerReliability: Record<string, number> = {};
    for (const [name] of this.agents) {
      const successCount = allResponses.filter((r) => r.provider === name).length;
      const totalRounds = runState.rounds.length;
      providerReliability[name] = (successCount / totalRounds) * 100;
    }

    return {
      synthesizedAnswer,
      confidenceEvolution,
      resolvedContradictions,
      unresolvedContradictions: lastRoundContradictions,
      keyFindings,
      providerReliability,
      rounds: runState.rounds,
      metadata: {
        totalRounds: runState.rounds.length,
        successfulProviders: runState.rounds.map(
          (r) => r.providerResults.filter((pr) => pr.status === 'ok').length
        ),
        totalTime: (runState.completedAt || Date.now()) - runState.createdAt,
      },
    };
  }

  /**
   * Synthesize final answer from all rounds
   */
  private synthesizeAnswer(rounds: RoundState[]): string {
    let synthesis = '# Ultimate Synthesized Answer\n\n';

    // Get final round analysis
    const finalRound = rounds[rounds.length - 1];

    if (!finalRound.analysis) {
      return 'Unable to generate synthesis - insufficient data.';
    }

    // Key findings
    if (finalRound.analysis.agreements.length > 0) {
      synthesis += '## Key Findings\n\n';
      finalRound.analysis.agreements.slice(0, 5).forEach((agreement, idx) => {
        synthesis += `${idx + 1}. ${agreement}\n`;
      });
      synthesis += '\n';
    }

    // Collect best responses from each provider
    const bestResponses = finalRound.providerResults
      .filter((r) => r.status === 'ok' && r.response)
      .sort((a, b) => (b.response?.length || 0) - (a.response?.length || 0));

    if (bestResponses.length > 0) {
      synthesis += '## Detailed Answer\n\n';

      // Use the most comprehensive response as base
      const baseResponse = bestResponses[0].response!;
      synthesis += baseResponse.substring(0, 1000); // First 1000 chars

      if (baseResponse.length > 1000) {
        synthesis += '...\n\n';
      }
    }

    // Unique insights
    if (finalRound.analysis.uniqueInsights.length > 0) {
      synthesis += '## Additional Insights\n\n';
      finalRound.analysis.uniqueInsights.forEach((insight) => {
        synthesis += `- **${insight.provider.toUpperCase()}**: ${insight.insight}\n`;
      });
      synthesis += '\n';
    }

    // Unresolved contradictions (if any)
    if (finalRound.analysis.contradictions.length > 0) {
      synthesis += '## Note on Disagreements\n\n';
      synthesis += 'Some points remain disputed:\n';
      finalRound.analysis.contradictions.slice(0, 3).forEach((c) => {
        const providers = Object.keys(c.views);
        synthesis += `- **${c.topic}**: ${providers.join(' vs ')}\n`;
      });
      synthesis += '\n';
    }

    // Metadata
    synthesis += `---\n\n*Synthesized from ${rounds.length} rounds across ${bestResponses.length} AI providers.*`;

    return synthesis;
  }

  /**
   * Get status of all agents
   */
  getAgentStatuses() {
    const statuses: Record<string, any> = {};

    for (const [name, agent] of this.agents) {
      statuses[name] = agent.getStatus();
    }

    return statuses;
  }

  /**
   * Get last round from previous runs (helper)
   */
  private getLastRound(): RoundState | null {
    // This would need to be implemented with state tracking
    return null;
  }

  /**
   * Timeout helper
   */
  private timeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
  }

  /**
   * Cleanup all agents
   */
  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up browser agents...');

    for (const [name, agent] of this.agents) {
      try {
        await agent.close();
        console.log(`  ✅ Closed ${name}`);
      } catch (error) {
        console.error(`  ❌ Error closing ${name}:`, error);
      }
    }

    this.agents.clear();
    this.initialized = false;
  }
}
