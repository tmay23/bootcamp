import React, { useState } from 'react';
import { SynthesisResult } from '../types';

interface ResultDisplayProps {
  result: SynthesisResult;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const [showIndividual, setShowIndividual] = useState(false);

  const formatMarkdown = (text: string) => {
    return text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="result-display">
      <div className="synthesis-section">
        <div className="section-header">
          <h2>✨ Best Synthesized Answer</h2>
          <div className="metadata">
            <span className="confidence" style={{
              color: result.analysis.confidence > 70 ? '#4caf50' :
                     result.analysis.confidence > 40 ? '#ff9800' : '#f44336'
            }}>
              {result.analysis.confidence.toFixed(0)}% Confidence
            </span>
            <span className="providers">
              {result.metadata.successfulProviders}/{result.metadata.totalProviders} Providers
            </span>
            <span className="time">{result.metadata.totalTime}ms</span>
          </div>
        </div>
        <div
          className="synthesized-content"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(result.synthesizedAnswer) }}
        />
      </div>

      {result.analysis.commonThemes.length > 0 && (
        <div className="analysis-section">
          <h3>🔍 Common Themes</h3>
          <div className="themes">
            {result.analysis.commonThemes.map((theme, idx) => (
              <span key={idx} className="theme-tag">
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.analysis.uniqueInsights.length > 0 && (
        <div className="analysis-section">
          <h3>💡 Unique Insights</h3>
          <div className="insights">
            {result.analysis.uniqueInsights.map((insight, idx) => (
              <div key={idx} className="insight-card">
                <span className={`provider-badge ${insight.provider}`}>
                  {insight.provider.toUpperCase()}
                </span>
                <p>{insight.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        className="toggle-individual"
        onClick={() => setShowIndividual(!showIndividual)}
      >
        {showIndividual ? '▼ Hide Individual Responses' : '▶ Show Individual Responses'}
      </button>

      {showIndividual && (
        <div className="individual-responses">
          <h3>📋 Individual AI Responses</h3>
          {result.individualResponses.map((response, idx) => (
            <div key={idx} className="response-card">
              <div className="response-header">
                <span className={`provider-badge ${response.provider}`}>
                  {response.provider.toUpperCase()}
                </span>
                <span className="response-time">{response.timestamp}ms</span>
                {response.tokensUsed && (
                  <span className="tokens">{response.tokensUsed} tokens</span>
                )}
              </div>
              {response.error ? (
                <div className="error-message">❌ {response.error}</div>
              ) : (
                <div className="response-content">{response.content}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
