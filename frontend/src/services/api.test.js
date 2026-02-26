/**
 * Tests for API service layer
 *
 * Covers analyzeDocument and semanticSearch request structure and error handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeDocument, semanticSearch } from "./api";

describe("api service", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe("analyzeDocument", () => {
    it("sends correct request structure", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ analysis: "Result", truncated: false }),
      });

      await analyzeDocument({
        documentText: "Sample text",
        documentType: "contracts",
        apiKey: "key123",
      });

      expect(fetch).toHaveBeenCalledWith("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_text: "Sample text",
          document_type: "contracts",
          api_key: "key123",
        }),
      });
    });

    it("throws on non-ok response", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Invalid API key" }),
      });

      await expect(
        analyzeDocument({
          documentText: "text",
          documentType: "general",
          apiKey: "bad",
        })
      ).rejects.toThrow("Invalid API key");
    });

    it("returns analysis and truncated flag", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analysis: "EXECUTIVE_SUMMARY\nDone.",
          truncated: true,
        }),
      });

      const result = await analyzeDocument({
        documentText: "x".repeat(30000),
        documentType: "general",
        apiKey: "key",
      });

      expect(result.analysis).toBe("EXECUTIVE_SUMMARY\nDone.");
      expect(result.truncated).toBe(true);
    });
  });

  describe("semanticSearch", () => {
    it("sends correct request structure", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          total_chunks: 5,
          query: "payment",
        }),
      });

      await semanticSearch({
        documentText: "Document content here",
        query: "payment",
        apiKey: "key123",
      });

      expect(fetch).toHaveBeenCalledWith("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_text: "Document content here",
          query: "payment",
          api_key: "key123",
        }),
      });
    });

    it("throws on error response", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Search failed" }),
      });

      await expect(
        semanticSearch({
          documentText: "text",
          query: "q",
          apiKey: "key",
        })
      ).rejects.toThrow("Search failed");
    });
  });
});
