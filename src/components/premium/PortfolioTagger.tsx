"use client";

import { useState, useTransition } from "react";
import type { PortfolioTagSuggestion } from "@/lib/premium/types";

type PortfolioTaggerProps = {
  draft: {
    title: string;
    description: string;
    evidence_type: string;
    parent_notes: string;
  };
  onApplySuggestions: (suggestions: PortfolioTagSuggestion[]) => void;
};

export function PortfolioTagger({ draft, onApplySuggestions }: PortfolioTaggerProps) {
  const [suggestions, setSuggestions] = useState<PortfolioTagSuggestion[]>([]);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [isPending, startTransition] = useTransition();

  async function loadSuggestions() {
    setError("");
    setWarning("");

    const response = await fetch("/api/ai/tag-portfolio-item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
    });

    const result = (await response.json()) as {
      error?: string;
      warning?: string | null;
      suggestions?: PortfolioTagSuggestion[];
    };

    if (!response.ok || !result.suggestions) {
      setError(result.error ?? "Unable to suggest tags.");
      return;
    }

    setSuggestions(result.suggestions);
    setWarning(result.warning ?? "");
    onApplySuggestions(result.suggestions);
  }

  return (
    <section className="stack">
      <div className="cta-row">
        <button
          type="button"
          className="button button-ghost"
          onClick={() => {
            startTransition(() => {
              void loadSuggestions();
            });
          }}
          disabled={isPending || !draft.title.trim()}
        >
          {isPending ? "Suggesting..." : "AI Suggest Tags"}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {warning ? <p className="success">{warning}</p> : null}
      {suggestions.length ? (
        <div className="premium-checklist">
          {suggestions.map((suggestion) => (
            <article key={suggestion.subject} className="premium-inline-card">
              <strong>{suggestion.subject}</strong>
              <span>{suggestion.reason}</span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
