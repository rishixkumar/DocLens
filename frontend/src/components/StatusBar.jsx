/**
 * StatusBar Component
 *
 * Non-blocking status indicator (e.g. "Buffering request…").
 */

import React from "react";

export function StatusBar({ visible, message }) {
  if (!visible) return null;
  return (
    <div className="status-bar visible">
      <div className="status-spinner" />
      <span>{message}</span>
    </div>
  );
}
