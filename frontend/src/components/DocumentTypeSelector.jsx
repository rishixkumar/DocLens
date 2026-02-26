/**
 * DocumentTypeSelector Component
 *
 * Horizontal button group for selecting document type.
 * Affects analysis prompt tailoring.
 */

import React from "react";

const TYPES = [
  { value: "contracts", label: "Contracts & Legal Docs" },
  { value: "research", label: "Research Papers" },
  { value: "business", label: "Business Reports" },
  { value: "general", label: "General PDF / Other" },
];

export function DocumentTypeSelector({ value, onChange }) {
  return (
    <section className="doc-type-section">
      <p className="doc-type-label">Document Type</p>
      <div className="doc-type-btns">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`doc-type-btn ${value === t.value ? "selected" : ""}`}
            onClick={() => onChange(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </section>
  );
}
