/**
 * SearchBar Component
 *
 * Semantic search input with history chips.
 * Calls backend /api/search endpoint.
 */

import React, { useState, useCallback } from "react";
import { semanticSearch } from "../services/api";

const MAX_HISTORY = 5;

export function SearchBar({
  disabled,
  documentChunks,
  documentText,
  apiKey,
  onError,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [history, setHistory] = useState([]);

  const runSearch = useCallback(
    async (q) => {
      const trimmed = (typeof q === "string" ? q : query).trim();
      if (!trimmed || !documentText || !apiKey) return;
      // apiKey can be "server" when backend has GROQ_API_KEY configured

      setHistory((prev) => {
        const next = [trimmed, ...prev.filter((h) => h !== trimmed)].slice(
          0,
          MAX_HISTORY
        );
        return next;
      });
      setIsSearching(true);
      setResults([]);

      try {
        const data = await semanticSearch({
          documentText,
          query: trimmed,
          apiKey: apiKey === "server" ? null : apiKey,
        });
        setResults(data.results || []);
      } catch (err) {
        onError(err.message || "Search failed");
      } finally {
        setIsSearching(false);
      }
    },
    [documentText, apiKey, query, onError]
  );

  const highlightQuery = (text, q) => {
    const terms = q.split(/\s+/).filter(Boolean);
    let result = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    terms.forEach((term) => {
      const re = new RegExp(
        `(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi"
      );
      result = result.replace(re, "<mark>$1</mark>");
    });
    return result;
  };

  const totalWords = documentText
    ? documentText.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <section className={`search-section ${disabled ? "disabled" : ""}`}>
      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Semantic search within document..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
          disabled={disabled}
        />
        <button
          type="button"
          className="search-btn"
          onClick={() => runSearch(query)}
          disabled={disabled || isSearching}
        >
          {isSearching ? "Searching…" : "Search"}
        </button>
      </div>

      {history.length > 0 && (
        <div className="search-history">
          {history.map((h) => (
            <button
              key={h}
              type="button"
              className="search-chip"
              onClick={() => {
                setQuery(h);
                runSearch(h);
              }}
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          {results.map((r, i) => {
            const chunk = documentChunks.find((c) => c.index === r.chunk_index);
            if (!chunk) return null;
            const score = Math.min(10, Math.max(1, r.relevance_score || 5));
            return (
              <div
                key={`${r.chunk_index}-${i}`}
                className="search-result-card"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="search-result-meta">
                  <span>
                    Chunk {r.chunk_index + 1} of {documentChunks.length} —
                    approx. words {chunk.startWord + 1}–{chunk.endWord} of{" "}
                    {totalWords}
                  </span>
                  <div className="relevance-bar-wrap">
                    <span>{score}/10</span>
                    <div className="relevance-bar">
                      <div
                        className="relevance-fill"
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
                <p className="search-result-reason">{r.reason}</p>
                <div
                  className="search-result-text"
                  dangerouslySetInnerHTML={{
                    __html: highlightQuery(chunk.text, query),
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {!isSearching && results.length === 0 && history.length > 0 && (
        <div className="search-empty">
          No relevant content found. Try broader search terms.
        </div>
      )}
    </section>
  );
}
