import React, { useState, useEffect } from 'react';
import { QueryForm } from './components/QueryForm';
import { ResultDisplay } from './components/ResultDisplay';
import { apiService } from './services/api';
import { SynthesisResult } from './types';
import './App.css';

function App() {
  const [result, setResult] = useState<SynthesisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await apiService.checkHealth();
      setAvailableProviders(health.availableProviders);
    } catch (err) {
      console.error('Failed to check API health:', err);
      setError('Unable to connect to the backend. Please ensure the server is running.');
    }
  };

  const handleQuery = async (prompt: string, providers: string[]) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiService.query(prompt, providers);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while querying the AIs');
      console.error('Query error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🤖 Multi-AI Comparison Tool</h1>
        <p>Query multiple AI providers simultaneously and get the best synthesized answer</p>
      </header>

      <main className="app-main">
        <QueryForm
          onSubmit={handleQuery}
          isLoading={isLoading}
          availableProviders={availableProviders}
        />

        {error && (
          <div className="error-banner">
            ❌ <strong>Error:</strong> {error}
          </div>
        )}

        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Querying AI providers in parallel...</p>
            <small>This may take a few seconds</small>
          </div>
        )}

        {result && !isLoading && <ResultDisplay result={result} />}
      </main>

      <footer className="app-footer">
        <p>
          Powered by Claude, ChatGPT, Gemini, and Grok | Built with React + TypeScript
        </p>
      </footer>
    </div>
  );
}

export default App;
