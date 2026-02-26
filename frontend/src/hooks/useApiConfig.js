/**
 * useApiConfig Hook
 *
 * Fetches server configuration on mount. Used to determine if the backend
 * has GROQ_API_KEY configured (from .env), in which case the user does
 * not need to enter an API key.
 */

import { useState, useEffect } from "react";
import { getConfig } from "../services/api";

export function useApiConfig() {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConfig()
      .then((data) => setHasApiKey(data.hasApiKey === true))
      .catch(() => setHasApiKey(false))
      .finally(() => setLoading(false));
  }, []);

  return { hasApiKey, loading };
}
