/**
 * AnalysisOutput Component
 *
 * Renders parsed analysis sections as collapsible panels.
 * Supports copy per section and export to file.
 */

import React, { useState, useMemo } from "react";

const SECTION_LABELS = [
  "EXECUTIVE_SUMMARY",
  "KEY_POINTS",
  "CRITICAL_FLAGS",
  "NAMED_ENTITIES",
  "RECOMMENDED_ACTIONS",
];

const SECTION_TITLES = {
  EXECUTIVE_SUMMARY: "Executive Summary",
  KEY_POINTS: "Key Points",
  CRITICAL_FLAGS: "Critical Flags",
  NAMED_ENTITIES: "Named Entities",
  RECOMMENDED_ACTIONS: "Recommended Actions",
};

const SECTION_CONFIG = {
  EXECUTIVE_SUMMARY: { class: "executive-summary", expanded: true },
  KEY_POINTS: { class: "", expanded: false },
  CRITICAL_FLAGS: { class: "critical-flags", expanded: false },
  NAMED_ENTITIES: { class: "", expanded: false },
  RECOMMENDED_ACTIONS: { class: "recommended-actions", expanded: false },
};

function parseSections(text) {
  const sections = {};
  let current = null;
  let buffer = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const upper = line.trim().toUpperCase();
    const matched = SECTION_LABELS.find(
      (l) => upper === l || upper.startsWith(l + ":")
    );
    if (matched) {
      if (current) sections[current] = buffer.join("\n").trim();
      current = matched;
      buffer = [];
    } else if (current) {
      buffer.push(line);
    }
  }
  if (current) sections[current] = buffer.join("\n").trim();
  return sections;
}

function EntityChips({ content }) {
  const lines = content.split("\n").filter(Boolean);
  const typeMap = {
    date: "date",
    person: "person",
    people: "person",
    money: "money",
    monetary: "money",
    organization: "organization",
    org: "organization",
  };
  const chips = [];
  lines.forEach((line) => {
    const colonIdx = line.indexOf(":");
    let type = "other";
    let items = line;
    if (colonIdx > 0) {
      type = typeMap[line.substring(0, colonIdx).toLowerCase()] || "other";
      items = line.substring(colonIdx + 1).trim();
    }
    items
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((item) => {
        chips.push({ type, item });
      });
  });
  return (
    <div className="entity-chips">
      {chips.map((c, i) => (
        <span key={i} className={`entity-chip ${c.type}`}>
          {c.item}
        </span>
      ))}
    </div>
  );
}

export function AnalysisOutput({ rawAnalysis, onExport }) {
  const sections = useMemo(
    () => (rawAnalysis ? parseSections(rawAnalysis) : {}),
    [rawAnalysis]
  );

  const [expanded, setExpanded] = useState({
    EXECUTIVE_SUMMARY: true,
    KEY_POINTS: false,
    CRITICAL_FLAGS: false,
    NAMED_ENTITIES: false,
    RECOMMENDED_ACTIONS: false,
  });

  const toggle = (label) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const copySection = (content) => {
    navigator.clipboard.writeText(content);
  };

  if (!rawAnalysis) return null;

  return (
    <section className="output-area">
      <div className="output-header">
        <h2 className="output-title">Analysis</h2>
        <button
          type="button"
          className="btn-export"
          onClick={onExport}
        >
          Export Analysis
        </button>
      </div>
      <div id="analysisOutput">
        {SECTION_LABELS.map((label) => {
          const content = sections[label] || "";
          const config = SECTION_CONFIG[label] || { class: "", expanded: false };
          const isExp = expanded[label] ?? config.expanded;
          const isNoFlags =
            label === "CRITICAL_FLAGS" && /^NONE\s*$/i.test(content.trim());

          let body;
          if (label === "NAMED_ENTITIES" && content) {
            body = <EntityChips content={content} />;
          } else if (label === "CRITICAL_FLAGS" && isNoFlags) {
            body = <span>No critical flags found</span>;
          } else {
            body = <pre className="section-body">{content}</pre>;
          }

          return (
            <div
              key={label}
              className={`section-panel ${config.class} ${
                isNoFlags ? "no-flags" : ""
              } ${isExp ? "expanded" : ""}`}
            >
              <div
                className="section-header"
                onClick={() => toggle(label)}
                onKeyDown={(e) =>
                  e.key === "Enter" && toggle(label)
                }
                role="button"
                tabIndex={0}
              >
                <span className="section-title">
                  {SECTION_TITLES[label] || label}
                </span>
                <span className="section-toggle">▼</span>
              </div>
              <div className="section-content">
                <div className="section-body-wrap">{body}</div>
                <div className="section-actions">
                  <button
                    type="button"
                    className="btn-copy"
                    title="Copy section"
                    onClick={(e) => {
                      e.stopPropagation();
                      copySection(content);
                    }}
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
