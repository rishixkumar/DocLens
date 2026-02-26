/**
 * ErrorBanner Component
 *
 * Dismissible red error banner.
 */

import React from "react";

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="error-banner visible">
      <span>{message}</span>
      <button type="button" className="error-dismiss" onClick={onDismiss}>
        ×
      </button>
    </div>
  );
}
