import React, { useState } from 'react';
import { IterativeResultDisplay } from './components/IterativeResultDisplay';
import axios from 'axios';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function BrowserModeApp() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Config state
  const [maxRounds, setMaxRounds] = useState(3);
  const [convergenceThreshold, setConvergenceThreshold] = useState(85);
  const [adaptiveRounds, setAdaptiveRounds] = useState(true);

  const handleInitialize = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await axios.post(`${API_URL}/api/browser/initialize`, {
        headless: false,
      });

      setInitialized(true);
      alert('Browser agents initialized! If you need to login, do so in the browser windows.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Initialization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/browser/query-iterative`, {
        prompt,
        config: {
          maxRounds,
          convergenceThreshold,
          adaptiveRounds,
          fillGaps: true,
          focusAreas: ['accuracy', 'depth'],
        },
      });

      setResult(response.data);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🤖 Multi-AI Comparison Tool</h1>
        <p className="mode-indicator">🌐 Browser Mode - Using Your Existing Subscriptions</p>
        <p>Iterative analysis with ChatGPT Plus & Claude Pro</p>
      </header>

      <main className="app-main">
        {!initialized && (
          <div className="init-panel">
            <h3>⚙️ Initialize Browser Agents</h3>
            <p>
              This will open browser windows for ChatGPT and Claude. If you're not logged in,
              you'll see a browser window where you can log in manually.
            </p>
            <button onClick={handleInitialize} disabled={isLoading} className="init-button">
              {isLoading ? '⏳ Initializing...' : '🚀 Initialize Browsers'}
            </button>
          </div>
        )}

        {initialized && (
          <>
            <form onSubmit={handleQuery} className="query-form">
              <div className="form-group">
                <label htmlFor="prompt">Your Question:</label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask a complex question that benefits from multiple AI perspectives..."
                  rows={4}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="config-section">
                <h4>⚙️ Configuration</h4>
                <div className="config-grid">
                  <div className="config-item">
                    <label>
                      Max Rounds:
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={maxRounds}
                        onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                        disabled={isLoading}
                      />
                    </label>
                  </div>

                  <div className="config-item">
                    <label>
                      Convergence Threshold:
                      <input
                        type="number"
                        min="60"
                        max="100"
                        value={convergenceThreshold}
                        onChange={(e) => setConvergenceThreshold(parseInt(e.target.value))}
                        disabled={isLoading}
                      />
                      %
                    </label>
                  </div>

                  <div className="config-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={adaptiveRounds}
                        onChange={(e) => setAdaptiveRounds(e.target.checked)}
                        disabled={isLoading}
                      />
                      Adaptive Rounds (stop early if confident)
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isLoading}>
                {isLoading ? '🔄 Processing...' : '🚀 Get Ultimate Answer'}
              </button>
            </form>

            {error && (
              <div className="error-banner">
                ❌ <strong>Error:</strong> {error}
              </div>
            )}

            {isLoading && (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Running iterative analysis...</p>
                <small>
                  This may take 30-90 seconds as we query multiple AIs and analyze their responses
                </small>
              </div>
            )}

            {result && !isLoading && <IterativeResultDisplay result={result} />}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Browser Automation Mode | Powered by Playwright + Your Subscriptions</p>
      </footer>
    </div>
  );
}

export default BrowserModeApp;
