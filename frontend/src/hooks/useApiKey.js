/**
 * useApiKey Hook
 *
 * Manages Groq API key state with localStorage persistence.
 * Key is stored under 'doclens_groq_key' and persists across sessions.
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "doclens_groq_key";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState("");
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setApiKeyState(saved);
  }, []);

  const setApiKey = useCallback((key) => {
    setApiKeyState(key);
    if (key) localStorage.setItem(STORAGE_KEY, key);
  }, []);

  const toggleKeyVisibility = useCallback(() => {
    setIsKeyVisible((v) => !v);
  }, []);

  return {
    apiKey,
    setApiKey,
    isKeyVisible,
    toggleKeyVisibility,
  };
}
