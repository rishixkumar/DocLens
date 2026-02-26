/**
 * DocLens Main Application Component
 *
 * Composes the full document analysis UI: API key config (when needed),
 * document ingestion, type selector, analysis trigger, and results display.
 * When backend has GROQ_API_KEY in .env, the API key section is hidden.
 */

import React, { useState, useCallback } from "react";
import { ApiKeySection } from "./components/ApiKeySection";
import { DocumentIngestion } from "./components/DocumentIngestion";
import { DocumentTypeSelector } from "./components/DocumentTypeSelector";
import { SearchBar } from "./components/SearchBar";
import { AnalyzeButton } from "./components/AnalyzeButton";
import { StatusBar } from "./components/StatusBar";
import { WarningBanner } from "./components/WarningBanner";
import { ErrorBanner } from "./components/ErrorBanner";
import { AnalysisOutput } from "./components/AnalysisOutput";
import { useDocument } from "./hooks/useDocument";
import { useApiKey } from "./hooks/useApiKey";
import { useApiConfig } from "./hooks/useApiConfig";

function App() {
  const { hasApiKey: serverHasKey } = useApiConfig();
  const { apiKey, setApiKey, isKeyVisible, toggleKeyVisibility } = useApiKey();
  const effectiveApiKey = serverHasKey ? "server" : apiKey;
  const {
    documentText,
    documentChunks,
    documentType,
    setDocumentType,
    fileName,
    fileMeta,
    hasDocument,
    setDocument,
    clearDocument,
    chunkDocument,
  } = useDocument();

  const [analysisRaw, setAnalysisRaw] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const hideError = useCallback(() => setError(""), []);
  const hideWarning = useCallback(() => setIsTruncated(false), []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="logo">DocLens</h1>
        <p className="tagline">AI Document Analyzer — Groq · Llama 3.3 70B</p>
      </header>

      {!serverHasKey && (
        <ApiKeySection
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          isVisible={isKeyVisible}
          onToggleVisibility={toggleKeyVisibility}
        />
      )}

      <DocumentIngestion
        onDocumentLoad={setDocument}
        onDocumentClear={clearDocument}
        fileName={fileName}
        fileMeta={fileMeta}
        hasDocument={hasDocument}
      />

      <DocumentTypeSelector
        value={documentType}
        onChange={setDocumentType}
      />

      <SearchBar
        disabled={!hasDocument}
        documentChunks={documentChunks}
        documentText={documentText}
        apiKey={effectiveApiKey}
        onError={setError}
      />

      <AnalyzeButton
        disabled={!hasDocument || !effectiveApiKey}
        loading={isAnalyzing}
        onClick={async () => {
          const text = (documentText || "").trim();
          if (!text || !effectiveApiKey) return;
          hideError();
          setIsAnalyzing(true);
          setStatusMessage("Analyzing…");
          try {
            const body = {
              document_text: text,
              document_type: documentType,
            };
            if (!serverHasKey && apiKey) body.api_key = apiKey;

            const res = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
              const detail = data.detail;
              const msg = Array.isArray(detail)
                ? detail.map((d) => d.msg || JSON.stringify(d)).join("; ")
                : typeof detail === "string"
                  ? detail
                  : "Analysis failed";
              setError(msg);
              return;
            }
            setIsTruncated(data.truncated || false);
            setAnalysisRaw(data.analysis);
          } catch (err) {
            setError(err.message || "Network error");
          } finally {
            setIsAnalyzing(false);
            setStatusMessage("");
          }
        }}
      />

      <StatusBar visible={!!statusMessage} message={statusMessage} />
      <WarningBanner visible={isTruncated} />
      <ErrorBanner message={error} onDismiss={hideError} />

      <AnalysisOutput
        rawAnalysis={analysisRaw}
        onExport={() => {
          if (!analysisRaw) return;
          const blob = new Blob([analysisRaw], { type: "text/plain" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "doclens-analysis.txt";
          a.click();
          URL.revokeObjectURL(a.href);
        }}
      />
    </div>
  );
}

export default App;
