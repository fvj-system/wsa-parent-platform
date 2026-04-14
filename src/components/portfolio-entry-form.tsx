"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getPortfolioEvidenceLabel,
  portfolioEvidenceTypeOptions,
} from "@/lib/homeschool-review";

type PortfolioEntryFormProps = {
  studentId: string;
  studentName: string;
};

export function PortfolioEntryForm({
  studentId,
  studentName,
}: PortfolioEntryFormProps) {
  const router = useRouter();
  const [scope, setScope] = useState<"student" | "household">("student");
  const [entryType, setEntryType] = useState<string>("diy_project");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        const form = event.currentTarget;
        const formData = new FormData(form);
        formData.set("scope", scope);
        formData.set("entryType", entryType);
        formData.set("studentId", scope === "student" ? studentId : "");

        startTransition(async () => {
          const response = await fetch("/api/portfolio-entries", {
            method: "POST",
            body: formData,
          });

          const payload = (await response.json()) as { entry?: { id: string }; error?: string };
          if (!response.ok || payload.error) {
            setError(payload.error ?? "Could not save this documentation entry.");
            return;
          }

          setSuccess(`${getPortfolioEvidenceLabel(entryType)} saved to the homeschool evidence log.`);
          form.reset();
          setScope("student");
          setEntryType("diy_project");
          router.refresh();
        });
      }}
    >
      <div className="portfolio-entry-form-grid">
        <label>
          Entry title
          <input name="title" placeholder="Pinecone bird feeder project" required />
        </label>
        <label>
          Entry date
          <input name="occurredAt" type="date" defaultValue={today} required />
        </label>
      </div>

      <div className="portfolio-entry-form-grid">
        <label>
          Documentation category
          <select
            value={entryType}
            onChange={(event) => setEntryType(event.target.value)}
          >
            {portfolioEvidenceTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Save for
          <select
            value={scope}
            onChange={(event) =>
              setScope(event.target.value === "household" ? "household" : "student")
            }
          >
            <option value="student">{studentName}</option>
            <option value="household">Whole household</option>
          </select>
        </label>
      </div>

      <label>
        Educational description
        <textarea
          name="summary"
          rows={3}
          placeholder="What was done, practiced, built, observed, or discussed?"
        />
      </label>

      <label>
        Parent notes
        <textarea
          name="notes"
          rows={3}
          placeholder="Optional note tied to the photo or activity."
        />
      </label>

      <label>
        Photo
        <input name="image" type="file" accept="image/*" />
      </label>

      <div className="cta-row">
        <button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save homeschool evidence"}
        </button>
      </div>

      {error ? <p className="error" style={{ margin: 0 }}>{error}</p> : null}
      {success ? <p className="success" style={{ margin: 0 }}>{success}</p> : null}
    </form>
  );
}
