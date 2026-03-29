import { BaseWebLLM } from './base-web-llm';
import {
  RoundAnalysis,
  Contradiction,
  Gap,
  FollowUpQuestion,
  ProviderResult,
} from '../../types/browser.types';

/**
 * Smart Analyzer that uses AI to analyze AI responses
 * This is meta-learning: using one AI to understand and synthesize other AIs
 */
export class SmartAnalyzer {
  private metaAI: BaseWebLLM; // The AI we use to do analysis

  constructor(metaAI: BaseWebLLM) {
    this.metaAI = metaAI;
  }

  /**
   * Analyze Round 1 using AI-powered analysis
   */
  async analyzeRound1(responses: ProviderResult[]): Promise<RoundAnalysis> {
    const successfulResponses = responses.filter((r) => r.status === 'ok' && r.response);

    if (successfulResponses.length === 0) {
      return this.createEmptyAnalysis(1);
    }

    if (successfulResponses.length === 1) {
      // Only one response - can't compare
      return {
        roundNumber: 1,
        agreements: ['Single response received'],
        contradictions: [],
        gaps: [],
        uniqueInsights: [
          {
            provider: successfulResponses[0].provider,
            insight: successfulResponses[0].response!.substring(0, 200),
          },
        ],
        confidence: 60,
        completeness: 50,
      };
    }

    // Format responses for AI analysis
    const formattedResponses = successfulResponses
      .map(
        (r) => `
**${r.provider.toUpperCase()} Response:**
${r.response}
`
      )
      .join('\n---\n');

    // Ask the meta-AI to analyze
    const analysisPrompt = `You are analyzing responses from multiple AI assistants. Compare and analyze these responses:

${formattedResponses}

Provide analysis in this EXACT format:

AGREEMENTS:
- [List common points they both agree on]
- [Each on a new line]

CONTRADICTIONS:
- [Topic]: [AI1] says [view1] but [AI2] says [view2] | Severity: [high/medium/low]
- [Each on a new line]

GAPS:
- [What important information is missing] | Importance: [high/medium/low]
- [Each on a new line]

UNIQUE_INSIGHTS:
- [AI1]: [Their unique valuable insight]
- [AI2]: [Their unique valuable insight]

CONFIDENCE: [0-100]
COMPLETENESS: [0-100]

Be specific and concrete. Focus on REAL differences in meaning, not just wording.`;

    try {
      console.log(`🤖 Using ${this.metaAI.getStatus().provider} for meta-analysis...`);
      const analysisText = await this.metaAI.query(analysisPrompt);

      // Parse the AI's analysis
      const analysis = this.parseAnalysisResponse(analysisText, 1, successfulResponses);

      console.log(`✅ Meta-analysis complete:`);
      console.log(`   Agreements: ${analysis.agreements.length}`);
      console.log(`   Contradictions: ${analysis.contradictions.length}`);
      console.log(`   Gaps: ${analysis.gaps.length}`);
      console.log(`   Confidence: ${analysis.confidence}%`);

      return analysis;
    } catch (error) {
      console.error('❌ Meta-analysis failed, using fallback:', error);
      return this.createFallbackAnalysis(1, successfulResponses);
    }
  }

  /**
   * Generate smart follow-up questions using AI
   */
  async generateFollowUpQuestions(
    analysis: RoundAnalysis,
    previousResponses: ProviderResult[]
  ): Promise<FollowUpQuestion[]> {
    if (analysis.contradictions.length === 0 && analysis.gaps.length === 0) {
      return []; // No follow-ups needed
    }

    const contradictionsSummary =
      analysis.contradictions.length > 0
        ? `CONTRADICTIONS:\n${analysis.contradictions
            .map((c) => `- ${c.topic}: ${JSON.stringify(c.views)}`)
            .join('\n')}`
        : '';

    const gapsSummary =
      analysis.gaps.length > 0
        ? `GAPS:\n${analysis.gaps.map((g) => `- ${g.description}`).join('\n')}`
        : '';

    const prompt = `Based on this analysis of multiple AI responses:

${contradictionsSummary}

${gapsSummary}

Generate 3-5 focused follow-up questions that will:
1. Resolve the contradictions (make the AIs debate and justify their positions)
2. Fill the information gaps
3. Push for deeper, more specific answers

Format:
Q1: [question text]
Reason: [why this question helps]

Q2: [question text]
Reason: [why this question helps]

Make questions specific and challenging. Force the AIs to confront their differences!`;

    try {
      console.log(`🤖 Generating smart follow-up questions...`);
      const response = await this.metaAI.query(prompt);

      const questions = this.parseFollowUpQuestions(response);

      console.log(`✅ Generated ${questions.length} follow-up questions`);
      questions.forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.question.substring(0, 80)}...`);
      });

      return questions;
    } catch (error) {
      console.error('❌ Follow-up generation failed:', error);
      return this.createFallbackFollowUps(analysis);
    }
  }

  /**
   * Create final synthesis using AI
   */
  async synthesizeFinalAnswer(allResponses: ProviderResult[][]): Promise<string> {
    const allRounds = allResponses
      .map((roundResponses, index) => {
        const formatted = roundResponses
          .filter((r) => r.status === 'ok' && r.response)
          .map((r) => `${r.provider}: ${r.response}`)
          .join('\n\n');

        return `**Round ${index + 1}:**\n${formatted}`;
      })
      .join('\n\n' + '='.repeat(60) + '\n\n');

    const synthesisPrompt = `You've seen multiple rounds of responses from different AI assistants on the same topic. Your job is to create the ULTIMATE ANSWER by:

1. Taking the BEST parts from each AI
2. Resolving contradictions with the most accurate information
3. Filling all gaps with complete information
4. Creating a synthesis that's BETTER than any individual response

All rounds of responses:

${allRounds}

Create a comprehensive, accurate, and complete answer that represents the best synthesis of all this information. Be specific, practical, and thorough.`;

    try {
      console.log(`🤖 Creating final synthesis...`);
      const synthesis = await this.metaAI.query(synthesisPrompt);
      console.log(`✅ Final synthesis created (${synthesis.length} chars)`);
      return synthesis;
    } catch (error) {
      console.error('❌ Synthesis failed:', error);
      // Fallback: concatenate all responses
      return allResponses
        .flat()
        .filter((r) => r.status === 'ok' && r.response)
        .map((r) => r.response)
        .join('\n\n---\n\n');
    }
  }

  /**
   * Parse AI's analysis response into structured format
   */
  private parseAnalysisResponse(
    text: string,
    roundNumber: number,
    responses: ProviderResult[]
  ): RoundAnalysis {
    const agreements: string[] = [];
    const contradictions: Contradiction[] = [];
    const gaps: Gap[] = [];
    const uniqueInsights: { provider: string; insight: string }[] = [];
    let confidence = 70;
    let completeness = 60;

    // Extract agreements
    const agreementsMatch = text.match(/AGREEMENTS:([\s\S]*?)(?=CONTRADICTIONS:|$)/i);
    if (agreementsMatch) {
      const lines = agreementsMatch[1].split('\n').filter((l) => l.trim().startsWith('-'));
      lines.forEach((line) => {
        const cleaned = line.replace(/^-\s*/, '').trim();
        if (cleaned) agreements.push(cleaned);
      });
    }

    // Extract contradictions
    const contradictionsMatch = text.match(/CONTRADICTIONS:([\s\S]*?)(?=GAPS:|$)/i);
    if (contradictionsMatch) {
      const lines = contradictionsMatch[1].split('\n').filter((l) => l.trim().startsWith('-'));
      lines.forEach((line) => {
        const parts = line.split('|');
        if (parts.length >= 2) {
          const topicAndViews = parts[0].replace(/^-\s*/, '').trim();
          const severityPart = parts[1].trim();

          // Parse severity
          const severity = severityPart.toLowerCase().includes('high')
            ? 'high'
            : severityPart.toLowerCase().includes('low')
            ? 'low'
            : 'medium';

          // Extract topic and views
          const match = topicAndViews.match(/^(.*?):\s*(.+?)\s+says\s+(.+?)\s+but\s+(.+?)\s+says\s+(.+)$/i);
          if (match) {
            const [, topic, ai1, view1, ai2, view2] = match;
            contradictions.push({
              topic: topic.trim(),
              views: {
                [ai1.trim()]: view1.trim(),
                [ai2.trim()]: view2.trim(),
              },
              severity: severity as 'high' | 'medium' | 'low',
            });
          }
        }
      });
    }

    // Extract gaps
    const gapsMatch = text.match(/GAPS:([\s\S]*?)(?=UNIQUE_INSIGHTS:|$)/i);
    if (gapsMatch) {
      const lines = gapsMatch[1].split('\n').filter((l) => l.trim().startsWith('-'));
      lines.forEach((line) => {
        const parts = line.split('|');
        const description = parts[0].replace(/^-\s*/, '').trim();
        const importance = parts[1]
          ? parts[1].toLowerCase().includes('high')
            ? 'high'
            : parts[1].toLowerCase().includes('low')
            ? 'low'
            : 'medium'
          : 'medium';

        if (description) {
          gaps.push({
            description,
            importance: importance as 'high' | 'medium' | 'low',
          });
        }
      });
    }

    // Extract unique insights
    const insightsMatch = text.match(/UNIQUE_INSIGHTS:([\s\S]*?)(?=CONFIDENCE:|$)/i);
    if (insightsMatch) {
      const lines = insightsMatch[1].split('\n').filter((l) => l.trim().startsWith('-'));
      lines.forEach((line) => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const provider = parts[0].replace(/^-\s*/, '').trim();
          const insight = parts.slice(1).join(':').trim();
          uniqueInsights.push({ provider, insight });
        }
      });
    }

    // Extract confidence
    const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
    if (confidenceMatch) {
      confidence = parseInt(confidenceMatch[1], 10);
    }

    // Extract completeness
    const completenessMatch = text.match(/COMPLETENESS:\s*(\d+)/i);
    if (completenessMatch) {
      completeness = parseInt(completenessMatch[1], 10);
    }

    return {
      roundNumber,
      agreements,
      contradictions,
      gaps,
      uniqueInsights,
      confidence,
      completeness,
    };
  }

  /**
   * Parse follow-up questions from AI response
   */
  private parseFollowUpQuestions(text: string): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = [];

    // Match Q1:, Q2:, etc.
    const questionMatches = text.matchAll(/Q\d+:\s*(.+?)(?=\nReason:|$)/gis);

    for (const match of questionMatches) {
      const question = match[1].trim();

      // Find the corresponding reason
      const reasonMatch = text.match(
        new RegExp(`Q\\d+:\\s*${question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*Reason:\\s*(.+?)(?=Q\\d+:|$)`, 'is')
      );

      const reason = reasonMatch ? reasonMatch[1].trim() : 'Improve understanding';

      questions.push({ question, reason });
    }

    return questions.slice(0, 5);
  }

  /**
   * Create empty analysis
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

  /**
   * Create fallback analysis if AI analysis fails
   */
  private createFallbackAnalysis(roundNumber: number, responses: ProviderResult[]): RoundAnalysis {
    return {
      roundNumber,
      agreements: ['Multiple responses received'],
      contradictions: [],
      gaps: [],
      uniqueInsights: responses.map((r) => ({
        provider: r.provider,
        insight: r.response?.substring(0, 200) || '',
      })),
      confidence: 60,
      completeness: 50,
    };
  }

  /**
   * Create fallback follow-up questions
   */
  private createFallbackFollowUps(analysis: RoundAnalysis): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = [];

    if (analysis.contradictions.length > 0) {
      const c = analysis.contradictions[0];
      questions.push({
        question: `There's disagreement about ${c.topic}. Which view is more accurate and why?`,
        reason: `Resolve contradiction: ${c.topic}`,
      });
    }

    if (analysis.gaps.length > 0) {
      questions.push({
        question: `Can you provide more details about: ${analysis.gaps[0].description}?`,
        reason: `Fill gap: ${analysis.gaps[0].description}`,
      });
    }

    questions.push({
      question: 'Can you provide specific examples to support your answer?',
      reason: 'Increase depth and specificity',
    });

    return questions;
  }
}
