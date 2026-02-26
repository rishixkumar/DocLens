/**
 * Tests for useApiKey hook
 *
 * Covers API key state, localStorage persistence, and visibility toggle.
 */

import { renderHook, act } from "@testing-library/react";
import { useApiKey } from "./useApiKey";

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => delete store[key],
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("useApiKey", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("loads saved key from localStorage on mount", () => {
    localStorageMock.setItem("doclens_groq_key", "saved_key_123");
    const { result } = renderHook(() => useApiKey());
    expect(result.current.apiKey).toBe("saved_key_123");
  });

  it("setApiKey updates state and localStorage", () => {
    const { result } = renderHook(() => useApiKey());
    act(() => {
      result.current.setApiKey("new_key");
    });
    expect(result.current.apiKey).toBe("new_key");
    expect(localStorageMock.getItem("doclens_groq_key")).toBe("new_key");
  });

  it("isKeyVisible starts false", () => {
    const { result } = renderHook(() => useApiKey());
    expect(result.current.isKeyVisible).toBe(false);
  });

  it("toggleKeyVisibility flips visibility", () => {
    const { result } = renderHook(() => useApiKey());
    act(() => {
      result.current.toggleKeyVisibility();
    });
    expect(result.current.isKeyVisible).toBe(true);
    act(() => {
      result.current.toggleKeyVisibility();
    });
    expect(result.current.isKeyVisible).toBe(false);
  });
});
