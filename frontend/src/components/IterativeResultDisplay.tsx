import React, { useState } from 'react';

interface IterativeResultProps {
  result: any; // IterativeSynthesisResult type
}

export const IterativeResultDisplay: React.FC<IterativeResultProps> = ({ result }) => {
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const [showAllResponses, setShowAllResponses] = useState(false);

  const toggleRound = (roundNum: number) => {
    setExpandedRound(expandedRound === roundNum ? null : roundNum);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return '#4caf50';
    if (confidence >= 60) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="iterative-result">
      {/* Confidence Evolution Chart */}
      <div className="confidence-evolution">
        <h2>📈 Confidence Evolution</h2>
        <div className="evolution-chart">
          {result.confidenceEvolution.map((conf: number, idx: number) => (
            <div key={idx} className="round-bar">
              <div className="round-label">Round {idx + 1}</div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{
                    width: `${conf}%`,
                    backgroundColor: getConfidenceColor(conf),
                  }}
                >
                  <span className="bar-text">{conf.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final Synthesis */}
      <div className="final-synthesis">
        <h2>✨ Ultimate Synthesized Answer</h2>
        <div className="final-confidence">
          <span
            style={{
              color: getConfidenceColor(
                result.confidenceEvolution[result.confidenceEvolution.length - 1]
              ),
            }}
          >
            Final Confidence: {result.confidenceEvolution[result.confidenceEvolution.length - 1].toFixed(0)}%
          </span>
        </div>
        <div className="synthesized-content">
          {result.synthesizedAnswer.split('\n').map((line: string, idx: number) => {
            if (line.startsWith('# ')) {
              return <h1 key={idx}>{line.substring(2)}</h1>;
            } else if (line.startsWith('## ')) {
              return <h2 key={idx}>{line.substring(3)}</h2>;
            } else if (line.startsWith('### ')) {
              return <h3 key={idx}>{line.substring(4)}</h3>;
            } else if (line.trim().startsWith('-')) {
              return <li key={idx}>{line.substring(line.indexOf('-') + 1).trim()}</li>;
            } else if (line.startsWith('**') && line.endsWith('**')) {
              return <strong key={idx}>{line.substring(2, line.length - 2)}</strong>;
            } else if (line.trim() === '') {
              return <br key={idx} />;
            } else {
              return <p key={idx}>{line}</p>;
            }
          })}
        </div>
      </div>

      {/* Key Findings */}
      {result.keyFindings && result.keyFindings.length > 0 && (
        <div className="key-findings">
          <h3>🎯 Key Findings</h3>
          <div className="findings-grid">
            {result.keyFindings.slice(0, 10).map((finding: string, idx: number) => (
              <span key={idx} className="finding-tag">
                {finding}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Contradictions */}
      {result.resolvedContradictions && result.resolvedContradictions.length > 0 && (
        <div className="resolved-contradictions">
          <h3>✅ Resolved Contradictions</h3>
          {result.resolvedContradictions.map((contradiction: any, idx: number) => (
            <div key={idx} className="contradiction-card resolved">
              <strong>{contradiction.topic}</strong>
              <div className="views">
                {Object.entries(contradiction.views).map(([provider, view]: any, i: number) => (
                  <div key={i} className="view-item">
                    <span className={`provider-badge ${provider}`}>
                      {provider.toUpperCase()}
                    </span>
                    : {view}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unresolved Contradictions */}
      {result.unresolvedContradictions && result.unresolvedContradictions.length > 0 && (
        <div className="unresolved-contradictions">
          <h3>⚠️ Remaining Disagreements</h3>
          {result.unresolvedContradictions.map((contradiction: any, idx: number) => (
            <div key={idx} className="contradiction-card unresolved">
              <strong>{contradiction.topic}</strong>
              <div className="views">
                {Object.entries(contradiction.views).map(([provider, view]: any, i: number) => (
                  <div key={i} className="view-item">
                    <span className={`provider-badge ${provider}`}>
                      {provider.toUpperCase()}
                    </span>
                    : {view}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provider Reliability */}
      {result.providerReliability && (
        <div className="provider-reliability">
          <h3>📊 Provider Reliability</h3>
          <div className="reliability-grid">
            {Object.entries(result.providerReliability).map(([provider, score]: any) => (
              <div key={provider} className="reliability-item">
                <span className={`provider-badge ${provider}`}>{provider.toUpperCase()}</span>
                <div className="reliability-bar">
                  <div
                    className="reliability-fill"
                    style={{ width: `${score}%`, backgroundColor: getConfidenceColor(score) }}
                  >
                    {score.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Round Details (Expandable) */}
      <div className="rounds-section">
        <h3>🔄 Round-by-Round Analysis</h3>
        {result.rounds.map((round: any, idx: number) => (
          <div key={idx} className="round-accordion">
            <button
              className="round-header"
              onClick={() => toggleRound(idx)}
              style={{
                backgroundColor: expandedRound === idx ? '#f5f5f5' : 'white',
              }}
            >
              <span className="round-title">
                Round {idx + 1}: {round.prompt.substring(0, 60)}...
              </span>
              <span className="round-stats">
                {round.providerResults.filter((r: any) => r.status === 'ok').length}/
                {round.providerResults.length} providers | {round.analysis?.confidence.toFixed(0)}%
                confidence
              </span>
              <span className="expand-icon">{expandedRound === idx ? '▼' : '▶'}</span>
            </button>

            {expandedRound === idx && (
              <div className="round-content">
                {/* Round Analysis */}
                {round.analysis && (
                  <div className="round-analysis">
                    <div className="analysis-stats">
                      <div className="stat">
                        <strong>Confidence:</strong> {round.analysis.confidence.toFixed(1)}%
                      </div>
                      <div className="stat">
                        <strong>Completeness:</strong> {round.analysis.completeness.toFixed(1)}%
                      </div>
                      <div className="stat">
                        <strong>Agreements:</strong> {round.analysis.agreements.length}
                      </div>
                      <div className="stat">
                        <strong>Contradictions:</strong> {round.analysis.contradictions.length}
                      </div>
                    </div>

                    {/* Unique Insights */}
                    {round.analysis.uniqueInsights && round.analysis.uniqueInsights.length > 0 && (
                      <div className="unique-insights">
                        <strong>💡 Unique Insights:</strong>
                        {round.analysis.uniqueInsights.map((insight: any, i: number) => (
                          <div key={i} className="insight-item">
                            <span className={`provider-badge ${insight.provider}`}>
                              {insight.provider.toUpperCase()}
                            </span>
                            : {insight.insight}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Provider Responses */}
                <div className="provider-responses">
                  <button
                    className="toggle-responses"
                    onClick={() => setShowAllResponses(!showAllResponses)}
                  >
                    {showAllResponses ? 'Hide' : 'Show'} Individual Responses
                  </button>

                  {showAllResponses &&
                    round.providerResults.map((result: any, i: number) => (
                      <div key={i} className="provider-response">
                        <div className="response-header">
                          <span className={`provider-badge ${result.provider}`}>
                            {result.provider.toUpperCase()}
                          </span>
                          <span className="response-time">{result.timestamp}ms</span>
                          <span
                            className={`status-badge ${result.status}`}
                          >
                            {result.status}
                          </span>
                        </div>
                        {result.status === 'ok' ? (
                          <div className="response-text">{result.response}</div>
                        ) : (
                          <div className="error-text">❌ {result.error || 'Failed'}</div>
                        )}
                      </div>
                    ))}
                </div>

                {/* Follow-up Questions */}
                {round.followUpQuestions && round.followUpQuestions.length > 0 && (
                  <div className="follow-up-questions">
                    <strong>🔄 Follow-up Questions Generated:</strong>
                    <ol>
                      {round.followUpQuestions.map((q: any, i: number) => (
                        <li key={i}>
                          {q.question} <em>({q.reason})</em>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Metadata */}
      <div className="metadata-footer">
        <p>
          Completed in {result.metadata.totalRounds} rounds | Total time:{' '}
          {(result.metadata.totalTime / 1000).toFixed(1)}s
        </p>
      </div>
    </div>
  );
};
