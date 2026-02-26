/**
 * DocumentIngestion Component
 *
 * Tabbed interface for Upload (drag-drop + file picker) and Paste modes.
 * Handles PDF, TXT, MD files; shows file summary when loaded.
 */

import React, { useState, useRef, useCallback } from "react";

const ACCEPTED_TYPES = [".pdf", ".txt", ".md"];

export function DocumentIngestion({
  onDocumentLoad,
  onDocumentClear,
  fileName,
  fileMeta,
  hasDocument,
}) {
  const [activeTab, setActiveTab] = useState("upload");
  const [pasteText, setPasteText] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!["pdf", "txt", "md"].includes(ext)) {
        return;
      }
      if (ext === "pdf") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const pdfjsLib = window.pdfjsLib;
            if (!pdfjsLib) {
              console.error("PDF.js not loaded");
              return;
            }
            const typedArray = new Uint8Array(e.target.result);
            const pdf = await pdfjsLib.getDocument(typedArray).promise;
            let text = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              text += content.items.map((item) => item.str).join(" ") + "\n";
            }
            onDocumentLoad(text, file.name, "PDF");
          } catch (err) {
            console.error("PDF parse error:", err);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          onDocumentLoad(e.target.result, file.name, ext.toUpperCase());
        };
        reader.readAsText(file);
      }
    },
    [onDocumentLoad]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove("dragover");
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handlePasteChange = useCallback(
    (e) => {
      const text = e.target.value;
      setPasteText(text);
      if (text.trim()) {
        onDocumentLoad(text, null, "Pasted");
      } else {
        onDocumentClear();
      }
    },
    [onDocumentLoad, onDocumentClear]
  );

  const handleClear = useCallback(() => {
    setPasteText("");
    onDocumentClear();
  }, [onDocumentClear]);

  return (
    <section className="ingestion-area">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <div className="tab-strip">
        <button
          type="button"
          className={`tab-btn ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          Upload
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "paste" ? "active" : ""}`}
          onClick={() => setActiveTab("paste")}
        >
          Paste
        </button>
      </div>

      {activeTab === "upload" && (
        <div className="upload-area">
          {!hasDocument ? (
            <div
              className="drop-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("dragover");
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove("dragover")}
              onDrop={handleDrop}
            >
              <p className="drop-zone-text">
                Drag and drop a PDF, TXT, or MD file
              </p>
              <p className="drop-zone-formats">— or click to browse —</p>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === "paste" && (
        <div className="paste-area active">
          <textarea
            className="paste-textarea"
            placeholder="Paste your document text here..."
            value={pasteText}
            onChange={handlePasteChange}
          />
          <p className="char-counter">{pasteText.length} characters</p>
        </div>
      )}

      {hasDocument && (
        <div className="file-summary visible">
          <div className="file-summary-grid">
            <div className="file-info">
              <p className="file-name">{fileName}</p>
              <p className="file-meta">{fileMeta}</p>
            </div>
            <button type="button" className="btn-remove" onClick={handleClear}>
              Remove / Replace
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
