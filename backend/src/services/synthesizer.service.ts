import { AIResponse, SynthesisResult } from '../types';

export class SynthesizerService {
  /**
   * Analyzes multiple AI responses and creates a synthesized best answer
   */
  synthesize(responses: AIResponse[]): SynthesisResult {
    const startTime = Date.now();

    // Filter out failed responses
    const successfulResponses = responses.filter(
      (r) => !r.error && r.content.trim().length > 0
    );

    if (successfulResponses.length === 0) {
      return {
        synthesizedAnswer: 'Unable to generate a synthesized answer. All providers failed.',
        individualResponses: responses,
        analysis: {
          commonThemes: [],
          uniqueInsights: [],
          confidence: 0,
        },
        metadata: {
          totalProviders: responses.length,
          successfulProviders: 0,
          totalTime: Date.now() - startTime,
        },
      };
    }

    // Extract common themes and unique insights
    const analysis = this.analyzeResponses(successfulResponses);

    // Create synthesized answer
    const synthesizedAnswer = this.createSynthesis(successfulResponses, analysis);

    return {
      synthesizedAnswer,
      individualResponses: responses,
      analysis: {
        commonThemes: analysis.commonThemes,
        uniqueInsights: analysis.uniqueInsights,
        confidence: this.calculateConfidence(successfulResponses, analysis),
      },
      metadata: {
        totalProviders: responses.length,
        successfulProviders: successfulResponses.length,
        totalTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Analyzes responses to find common themes and unique insights
   */
  private analyzeResponses(responses: AIResponse[]): {
    commonThemes: string[];
    uniqueInsights: { provider: string; insight: string }[];
  } {
    const commonThemes: string[] = [];
    const uniqueInsights: { provider: string; insight: string }[] = [];

    // Simple word frequency analysis for common themes
    const wordFrequency = new Map<string, number>();
    const providerWords = new Map<string, Set<string>>();

    responses.forEach((response) => {
      const words = this.extractKeywords(response.content);
      providerWords.set(response.provider, new Set(words));

      words.forEach((word) => {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      });
    });

    // Find common themes (words appearing in multiple responses)
    const threshold = Math.max(2, Math.floor(responses.length * 0.6));
    wordFrequency.forEach((count, word) => {
      if (count >= threshold) {
        commonThemes.push(word);
      }
    });

    // Find unique insights (concepts mentioned by only one provider)
    responses.forEach((response) => {
      const uniqueWords = Array.from(providerWords.get(response.provider) || []).filter(
        (word) => (wordFrequency.get(word) || 0) === 1
      );

      if (uniqueWords.length > 0) {
        // Extract sentence containing unique word as insight
        const sentences = response.content.split(/[.!?]+/);
        const insightSentence = sentences.find((s) =>
          uniqueWords.some((w) => s.toLowerCase().includes(w.toLowerCase()))
        );

        if (insightSentence && insightSentence.trim().length > 20) {
          uniqueInsights.push({
            provider: response.provider,
            insight: insightSentence.trim(),
          });
        }
      }
    });

    return {
      commonThemes: commonThemes.slice(0, 10), // Top 10 themes
      uniqueInsights: uniqueInsights.slice(0, 5), // Top 5 unique insights
    };
  }

  /**
   * Creates a synthesized answer from multiple responses
   */
  private createSynthesis(
    responses: AIResponse[],
    analysis: {
      commonThemes: string[];
      uniqueInsights: { provider: string; insight: string }[];
    }
  ): string {
    // Strategy: Combine the best parts from each response
    let synthesis = '';

    // 1. Start with the most comprehensive response (longest non-error response)
    const sortedByLength = [...responses].sort((a, b) => b.content.length - a.content.length);
    const baseResponse = sortedByLength[0];

    // 2. Extract key points from all responses
    const allKeyPoints = responses.flatMap((r) => this.extractKeyPoints(r.content));

    // 3. Remove duplicates and rank by frequency
    const uniquePoints = this.deduplicatePoints(allKeyPoints);

    // 4. Build synthesis
    synthesis = `## Synthesized Answer\n\n`;

    // Add main content based on most common points
    uniquePoints.slice(0, 8).forEach((point, idx) => {
      if (point.trim().length > 20) {
        synthesis += `${idx + 1}. ${point}\n\n`;
      }
    });

    // 5. Add unique insights if available
    if (analysis.uniqueInsights.length > 0) {
      synthesis += `\n### Additional Insights\n\n`;
      analysis.uniqueInsights.forEach((insight) => {
        synthesis += `- **${insight.provider.toUpperCase()}**: ${insight.insight}\n`;
      });
    }

    // 6. Add consensus note
    if (responses.length > 1) {
      synthesis += `\n---\n*This answer synthesizes insights from ${responses.length} AI providers to provide a comprehensive and balanced response.*`;
    }

    return synthesis;
  }

  /**
   * Extracts keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Remove common stop words and extract meaningful words
    const stopWords = new Set([
      'the',
      'be',
      'to',
      'of',
      'and',
      'a',
      'in',
      'that',
      'have',
      'i',
      'it',
      'for',
      'not',
      'on',
      'with',
      'he',
      'as',
      'you',
      'do',
      'at',
      'this',
      'but',
      'his',
      'by',
      'from',
      'they',
      'we',
      'say',
      'her',
      'she',
      'or',
      'an',
      'will',
      'my',
      'one',
      'all',
      'would',
      'there',
      'their',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 4 && !stopWords.has(word));
  }

  /**
   * Extracts key points from text
   */
  private extractKeyPoints(text: string): string[] {
    // Split by sentences and filter meaningful ones
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 30 && s.length < 300);

    return sentences;
  }

  /**
   * Removes duplicate points based on semantic similarity
   */
  private deduplicatePoints(points: string[]): string[] {
    const unique: string[] = [];

    points.forEach((point) => {
      // Simple deduplication: check if similar point exists
      const isDuplicate = unique.some((existing) => this.areSimilar(existing, point));

      if (!isDuplicate) {
        unique.push(point);
      }
    });

    return unique;
  }

  /**
   * Checks if two strings are similar (simple implementation)
   */
  private areSimilar(str1: string, str2: string, threshold: number = 0.7): boolean {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    const similarity = intersection.size / union.size;
    return similarity >= threshold;
  }

  /**
   * Calculates confidence score based on response agreement
   */
  private calculateConfidence(
    responses: AIResponse[],
    analysis: { commonThemes: string[] }
  ): number {
    if (responses.length === 0) return 0;
    if (responses.length === 1) return 0.7; // Single source = moderate confidence

    // More common themes = higher confidence
    const themeScore = Math.min(analysis.commonThemes.length / 10, 1);

    // More successful responses = higher confidence
    const responseScore = responses.length / 4; // Max 4 providers

    // Average response length (longer = more detailed = higher confidence)
    const avgLength = responses.reduce((sum, r) => sum + r.content.length, 0) / responses.length;
    const lengthScore = Math.min(avgLength / 2000, 1);

    // Combined confidence score
    return Math.min((themeScore * 0.4 + responseScore * 0.3 + lengthScore * 0.3) * 100, 95);
  }
}
