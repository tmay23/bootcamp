import React, { useState } from 'react';

interface QueryFormProps {
  onSubmit: (prompt: string, providers: string[]) => void;
  isLoading: boolean;
  availableProviders: string[];
}

export const QueryForm: React.FC<QueryFormProps> = ({
  onSubmit,
  isLoading,
  availableProviders,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>(availableProviders);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && selectedProviders.length > 0) {
      onSubmit(prompt, selectedProviders);
    }
  };

  const toggleProvider = (provider: string) => {
    setSelectedProviders((prev) =>
      prev.includes(provider) ? prev.filter((p) => p !== provider) : [...prev, provider]
    );
  };

  React.useEffect(() => {
    setSelectedProviders(availableProviders);
  }, [availableProviders]);

  return (
    <form onSubmit={handleSubmit} className="query-form">
      <div className="form-group">
        <label htmlFor="prompt">Your Question:</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a question to compare answers from multiple AI providers..."
          rows={4}
          disabled={isLoading}
          required
        />
      </div>

      <div className="form-group">
        <label>Select AI Providers:</label>
        <div className="provider-checkboxes">
          {availableProviders.map((provider) => (
            <label key={provider} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedProviders.includes(provider)}
                onChange={() => toggleProvider(provider)}
                disabled={isLoading}
              />
              <span className={`provider-badge ${provider}`}>
                {provider.toUpperCase()}
              </span>
            </label>
          ))}
        </div>
        {availableProviders.length === 0 && (
          <p className="warning">No AI providers configured. Please check your API keys.</p>
        )}
      </div>

      <button type="submit" disabled={isLoading || selectedProviders.length === 0}>
        {isLoading ? '🔄 Querying AI providers...' : '🚀 Get Best Answer'}
      </button>
    </form>
  );
};
