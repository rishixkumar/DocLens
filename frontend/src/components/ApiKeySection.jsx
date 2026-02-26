/**
 * ApiKeySection Component
 *
 * Input for Groq API key with show/hide toggle and storage note.
 */

import React from "react";

export function ApiKeySection({
  apiKey,
  onApiKeyChange,
  isVisible,
  onToggleVisibility,
}) {
  return (
    <section className="api-section">
      <div className="api-key-wrapper">
        <div className="api-key-input-wrap">
          <input
            type={isVisible ? "text" : "password"}
            className="api-key-input"
            placeholder="Enter your Groq API key"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            onBlur={(e) => e.target.value && onApiKeyChange(e.target.value)}
          />
          <button
            type="button"
            className="api-key-toggle"
            onClick={onToggleVisibility}
            title={isVisible ? "Hide key" : "Show key"}
          >
            {isVisible ? "🙈" : "👁"}
          </button>
        </div>
      </div>
      <p className="api-note">
        Your API key is stored locally and sent only to api.groq.com. Get a
        free key at console.groq.com
      </p>
    </section>
  );
}
