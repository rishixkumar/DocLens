/**
 * WarningBanner Component
 *
 * Yellow banner for truncation warning.
 */

import React from "react";

export function WarningBanner({ visible }) {
  if (!visible) return null;
  return (
    <div className="warning-banner visible">
      Document truncated to fit model context limits. Results may be partial.
    </div>
  );
}
