import {
  RoundAnalysis,
  Contradiction,
  Gap,
  FollowUpQuestion,
  ProviderResult,
} from '../../types/browser.types';

export class IterativeAnalyzer {
  /**
   * Analyze Round 1: Initial discovery
   */
  analyzeRound1(responses: ProviderResult[]): RoundAnalysis {
    const successfulResponses = responses.filter((r) => r.status === 'ok' && r.response);

    if (successfulResponses.length === 0) {
      return this.createEmptyAnalysis(1);
    }

    const contents = successfulResponses.map((r) => r.response!);

    // Extract agreements, contradictions, and gaps
    const agreements = this.findAgreements(contents);
    const contradictions = this.findContradictions(successfulResponses);
    const gaps = this.identifyGaps(contents);
    const uniqueInsights = this.extractUniqueInsights(successfulResponses);

    // Calculate initial confidence
    const confidence = this.calculateConfidence(successfulResponses.length, agreements, contradictions);

    // Calculate completeness
    const completeness = this.calculateCompleteness(contents, gaps);

    return {
      roundNumber: 1,
      agreements,
      contradictions,
      gaps,
      uniqueInsights,
      confidence,
      completeness,
    };
  }

  /**
   * Analyze subsequent rounds
   */
  analyzeRound(
    roundNumber: number,
    responses: ProviderResult[],
    previousAnalysis: RoundAnalysis
  ): RoundAnalysis {
    const successfulResponses = responses.filter((r) => r.status === 'ok' && r.response);

    if (successfulResponses.length === 0) {
      return this.createEmptyAnalysis(roundNumber);
    }

    const contents = successfulResponses.map((r) => r.response!);

    // Re-analyze with context from previous round
    const agreements = this.findAgreements(contents);
    const contradictions = this.findContradictions(successfulResponses);
    const gaps = this.identifyGaps(contents);
    const uniqueInsights = this.extractUniqueInsights(successfulResponses);

    // Check which previous contradictions were resolved
    const resolvedContradictions = this.findResolvedContradictions(
      previousAnalysis.contradictions,
      successfulResponses
    );

    // Higher confidence in later rounds if contradictions resolved
    const baseConfidence = this.calculateConfidence(successfulResponses.length, agreements, contradictions);
    const resolutionBonus = (resolvedContradictions.length / Math.max(previousAnalysis.contradictions.length, 1)) * 20;
    const confidence = Math.min(baseConfidence + resolutionBonus, 100);

    const completeness = this.calculateCompleteness(contents, gaps);

    return {
      roundNumber,
      agreements,
      contradictions: contradictions.filter(
        (c) => !resolvedContradictions.some((rc) => rc.topic === c.topic)
      ),
      gaps,
      uniqueInsights,
      confidence,
      completeness,
    };
  }

  /**
   * Generate follow-up questions based on analysis
   */
  generateFollowUpQuestions(analysis: RoundAnalysis): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = [];

    // Questions to resolve contradictions
    for (const contradiction of analysis.contradictions) {
      if (contradiction.severity === 'high' || contradiction.severity === 'medium') {
        const providers = Object.keys(contradiction.views);
        const question = `${contradiction.topic}: ${providers[0]} says "${contradiction.views[providers[0]]}" but ${providers[1]} says "${contradiction.views[providers[1]]}". Which is more accurate and why?`;

        questions.push({
          question,
          reason: `Resolve contradiction about: ${contradiction.topic}`,
          targetProviders: providers,
        });
      }
    }

    // Questions to fill gaps
    for (const gap of analysis.gaps) {
      if (gap.importance === 'high' || gap.importance === 'medium') {
        questions.push({
          question: `None of the previous responses mentioned: ${gap.description}. Is this relevant? If so, please explain.`,
          reason: `Fill information gap: ${gap.description}`,
        });
      }
    }

    // If confidence is low, ask for deeper explanation
    if (analysis.confidence < 60) {
      questions.push({
        question: 'Please provide more specific examples and evidence to support your previous answer.',
        reason: 'Increase depth and confidence',
      });
    }

    return questions.slice(0, 5); // Max 5 follow-up questions
  }

  /**
   * Find common agreements across responses
   */
  private findAgreements(contents: string[]): string[] {
    const agreements: string[] = [];

    // Extract key phrases (simple word frequency)
    const allWords = contents.flatMap((c) => this.extractKeyPhrases(c));
    const wordFreq = new Map<string, number>();

    for (const word of allWords) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    // Threshold: mentioned in at least 60% of responses
    const threshold = Math.ceil(contents.length * 0.6);

    for (const [phrase, count] of wordFreq.entries()) {
      if (count >= threshold) {
        agreements.push(phrase);
      }
    }

    return agreements.slice(0, 10); // Top 10 agreements
  }

  /**
   * Find contradictions between responses
   */
  private findContradictions(responses: ProviderResult[]): Contradiction[] {
    const contradictions: Contradiction[] = [];

    // Simple heuristic: look for opposing keywords
    const opposingPairs = [
      ['yes', 'no'],
      ['true', 'false'],
      ['should', "shouldn't"],
      ['recommended', 'not recommended'],
      ['better', 'worse'],
      ['increase', 'decrease'],
    ];

    for (const [word1, word2] of opposingPairs) {
      const providers1 = responses.filter((r) => r.response?.toLowerCase().includes(word1));
      const providers2 = responses.filter((r) => r.response?.toLowerCase().includes(word2));

      if (providers1.length > 0 && providers2.length > 0) {
        const views: Record<string, string> = {};
        providers1.forEach((p) => (views[p.provider] = word1));
        providers2.forEach((p) => (views[p.provider] = word2));

        contradictions.push({
          topic: `Opinion on approach`,
          views,
          severity: 'medium',
        });
      }
    }

    return contradictions;
  }

  /**
   * Identify information gaps
   */
  private identifyGaps(contents: string[]): Gap[] {
    const gaps: Gap[] = [];

    // Check for common topics that might be missing
    const expectedTopics = [
      'examples',
      'best practices',
      'common mistakes',
      'alternatives',
      'trade-offs',
      'performance',
      'security',
    ];

    for (const topic of expectedTopics) {
      const mentioned = contents.some((c) => c.toLowerCase().includes(topic));

      if (!mentioned) {
        gaps.push({
          description: topic,
          importance: 'medium',
        });
      }
    }

    return gaps.slice(0, 5); // Top 5 gaps
  }

  /**
   * Extract unique insights from each provider
   */
  private extractUniqueInsights(responses: ProviderResult[]): { provider: string; insight: string }[] {
    const insights: { provider: string; insight: string }[] = [];

    for (const response of responses) {
      if (!response.response) continue;

      // Extract sentences unique to this provider
      const sentences = response.response.split(/[.!?]+/);
      const otherContents = responses
        .filter((r) => r.provider !== response.provider && r.response)
        .map((r) => r.response!.toLowerCase());

      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (trimmed.length < 20) continue;

        // Check if this sentence appears in other responses
        const isUnique = !otherContents.some((content) =>
          content.includes(trimmed.toLowerCase())
        );

        if (isUnique && trimmed.length > 30) {
          insights.push({
            provider: response.provider,
            insight: trimmed,
          });
          break; // One insight per provider
        }
      }
    }

    return insights;
  }

  /**
   * Check which contradictions were resolved in new round
   */
  private findResolvedContradictions(
    previousContradictions: Contradiction[],
    newResponses: ProviderResult[]
  ): Contradiction[] {
    // Simple heuristic: if new responses show more agreement, consider resolved
    return previousContradictions.filter((contradiction) => {
      const providers = Object.keys(contradiction.views);
      const newViewsOnTopic = newResponses
        .filter((r) => providers.includes(r.provider))
        .map((r) => r.response?.toLowerCase());

      // If responses now contain similar keywords, consider resolved
      const keywords = Object.values(contradiction.views);
      const agreementCount = newViewsOnTopic.filter((view) =>
        keywords.some((kw) => view?.includes(kw.toLowerCase()))
      ).length;

      return agreementCount >= providers.length * 0.8; // 80% agreement
    });
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    responseCount: number,
    agreements: string[],
    contradictions: Contradiction[]
  ): number {
    let confidence = 50; // Base

    // More responses = higher confidence
    confidence += responseCount * 10;

    // More agreements = higher confidence
    confidence += agreements.length * 3;

    // Contradictions reduce confidence
    confidence -= contradictions.length * 10;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Calculate completeness score
   */
  private calculateCompleteness(contents: string[], gaps: Gap[]): number {
    const avgLength = contents.reduce((sum, c) => sum + c.length, 0) / contents.length;

    let completeness = 50;

    // Longer responses = more complete
    if (avgLength > 500) completeness += 20;
    if (avgLength > 1000) completeness += 10;

    // Fewer gaps = more complete
    completeness -= gaps.length * 5;

    return Math.max(0, Math.min(100, completeness));
  }

  /**
   * Extract key phrases from text
   */
  private extractKeyPhrases(text: string): string[] {
    // Simple extraction: words longer than 5 chars, excluding common words
    const stopWords = new Set([
      'the',
      'this',
      'that',
      'these',
      'those',
      'with',
      'from',
      'have',
      'will',
      'would',
      'should',
      'could',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 5 && !stopWords.has(word));
  }

  /**
   * Create empty analysis for failed rounds
   */
  private createEmptyAnalysis(roundNumber: number): RoundAnalysis {
    return {
      roundNumber,
      agreements: [],
      contradictions: [],
      gaps: [],
      uniqueInsights: [],
      confidence: 0,
      completeness: 0,
    };
  }
}
