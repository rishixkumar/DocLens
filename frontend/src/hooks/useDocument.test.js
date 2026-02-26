/**
 * Tests for useDocument hook
 *
 * Covers document state, chunking logic, setDocument, clearDocument,
 * and edge cases (empty, single word, large documents).
 */

import { renderHook, act } from "@testing-library/react";
import { useDocument } from "./useDocument";

describe("useDocument", () => {
  it("starts with no document", () => {
    const { result } = renderHook(() => useDocument());
    expect(result.current.hasDocument).toBe(false);
    expect(result.current.documentText).toBe("");
    expect(result.current.documentChunks).toEqual([]);
  });

  it("setDocument updates text and metadata", () => {
    const { result } = renderHook(() => useDocument());
    act(() => {
      result.current.setDocument("Hello world", "test.txt", "TXT");
    });
    expect(result.current.documentText).toBe("Hello world");
    expect(result.current.fileName).toBe("test.txt");
    expect(result.current.hasDocument).toBe(true);
    expect(result.current.fileMeta).toContain("2 words");
    expect(result.current.fileMeta).toContain("11 characters");
  });

  it("clearDocument resets state", () => {
    const { result } = renderHook(() => useDocument());
    act(() => {
      result.current.setDocument("Some text", "file.txt", "TXT");
    });
    act(() => {
      result.current.clearDocument();
    });
    expect(result.current.documentText).toBe("");
    expect(result.current.fileName).toBe("");
    expect(result.current.hasDocument).toBe(false);
  });

  it("chunks small document into one chunk", () => {
    const { result } = renderHook(() => useDocument());
    const shortText = "word ".repeat(50);
    act(() => {
      result.current.setDocument(shortText.trim(), null, "Pasted");
    });
    expect(result.current.documentChunks.length).toBe(1);
    expect(result.current.documentChunks[0].index).toBe(0);
    expect(result.current.documentChunks[0].startWord).toBe(0);
  });

  it("chunks larger document into multiple chunks", () => {
    const { result } = renderHook(() => useDocument());
    const longText = "word ".repeat(500);
    act(() => {
      result.current.setDocument(longText.trim(), null, "Pasted");
    });
    expect(result.current.documentChunks.length).toBeGreaterThan(1);
    expect(result.current.documentChunks[0].index).toBe(0);
    expect(result.current.documentChunks[1].index).toBe(1);
  });

  it("documentType defaults to contracts", () => {
    const { result } = renderHook(() => useDocument());
    expect(result.current.documentType).toBe("contracts");
  });

  it("setDocumentType updates document type", () => {
    const { result } = renderHook(() => useDocument());
    act(() => {
      result.current.setDocumentType("research");
    });
    expect(result.current.documentType).toBe("research");
  });

  it("empty string produces no chunks", () => {
    const { result } = renderHook(() => useDocument());
    act(() => {
      result.current.setDocument("", null, "Pasted");
    });
    expect(result.current.documentChunks).toEqual([]);
  });

  it("single word produces one chunk", () => {
    const { result } = renderHook(() => useDocument());
    act(() => {
      result.current.setDocument("hello", null, "Pasted");
    });
    expect(result.current.documentChunks.length).toBe(1);
    expect(result.current.documentChunks[0].text).toBe("hello");
  });
});
