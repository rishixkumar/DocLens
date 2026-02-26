/**
 * API Service Layer
 *
 * Centralized functions for calling the DocLens backend (FastAPI).
 * All requests are sent to /api/* which is proxied to the backend.
 * When the server has GROQ_API_KEY in .env, apiKey can be omitted.
 */

const API_BASE = "/api";

/**
 * Fetch client configuration (e.g. whether server has API key configured).
 *
 * @returns {Promise<{ hasApiKey: boolean }>}
 */
export async function getConfig() {
  const res = await fetch(`${API_BASE}/config`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Config fetch failed");
  return data;
}

/**
 * Analyze a document and return structured analysis.
 *
 * @param {Object} params
 * @param {string} params.documentText - Raw document text
 * @param {string} params.documentType - contracts | research | business | general
 * @param {string} [params.apiKey] - Groq API key (optional if server has GROQ_API_KEY)
 * @returns {Promise<{ analysis: string, truncated: boolean }>}
 */
export async function analyzeDocument({
  documentText,
  documentType,
  apiKey = null,
}) {
  const body = {
    document_text: documentText,
    document_type: documentType,
  };
  if (apiKey) body.api_key = apiKey;

  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Analysis failed");
  return data;
}

/**
 * Perform semantic search within a document.
 *
 * @param {Object} params
 * @param {string} params.documentText - Full document text
 * @param {string} params.query - Search query
 * @param {string} [params.apiKey] - Groq API key (optional if server has GROQ_API_KEY)
 * @returns {Promise<{ results: Array, total_chunks: number, query: string }>}
 */
export async function semanticSearch({
  documentText,
  query,
  apiKey = null,
}) {
  const body = { document_text: documentText, query };
  if (apiKey) body.api_key = apiKey;

  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Search failed");
  return data;
}
