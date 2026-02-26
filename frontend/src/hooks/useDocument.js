/**
 * useDocument Hook
 *
 * Manages document state: text content, chunks for search, file metadata,
 * and document type. Handles chunking logic when document changes.
 */

import { useState, useCallback, useMemo } from "react";

const CHUNK_WORDS = 400;
const CHUNK_OVERLAP = 50;

function chunkDocument(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const chunkWords = words.slice(i, i + CHUNK_WORDS);
    chunks.push({
      index: chunks.length,
      text: chunkWords.join(" "),
      startWord: i,
      endWord: Math.min(i + CHUNK_WORDS, words.length),
    });
    i += CHUNK_WORDS - CHUNK_OVERLAP;
  }
  return chunks;
}

export function useDocument() {
  const [documentText, setDocumentText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileMeta, setFileMeta] = useState("");
  const [documentType, setDocumentType] = useState("contracts");

  const documentChunks = useMemo(
    () => (documentText ? chunkDocument(documentText) : []),
    [documentText]
  );

  const setDocument = useCallback((text, name, type) => {
    setDocumentText(text);
    setFileName(name || "Pasted text");
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setFileMeta(
      `${type || "Document"} · ${words.toLocaleString()} words · ${text.length.toLocaleString()} characters`
    );
  }, []);

  const clearDocument = useCallback(() => {
    setDocumentText("");
    setFileName("");
    setFileMeta("");
  }, []);

  return {
    documentText,
    documentChunks,
    documentType,
    setDocumentType,
    fileName,
    fileMeta,
    hasDocument: !!documentText,
    setDocument,
    clearDocument,
  };
}
