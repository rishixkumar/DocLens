/**
 * AnalyzeButton Component
 *
 * Primary CTA to trigger document analysis.
 * Shows loading spinner during API call.
 */

import React from "react";

export function AnalyzeButton({ disabled, loading, onClick }) {
  return (
    <section className="analyze-section">
      <button
        type="button"
        className={`btn-analyze ${loading ? "pulse loading" : ""}`}
        disabled={disabled || loading}
        onClick={onClick}
      >
        <span className="btn-spinner" />
        <span className="btn-text">Analyze Document</span>
      </button>
    </section>
  );
}
