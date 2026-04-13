"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseFacebookClassImport } from "@/lib/facebook-class-import";
import { WSA_FACEBOOK_URL } from "@/lib/social";

export function AdminClassImportCard() {
  const router = useRouter();
  const [sourceText, setSourceText] = useState("");
  const [sourceUrl, setSourceUrl] = useState(WSA_FACEBOOK_URL);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="panel stack">
      <div className="header-row">
        <div>
          <p className="eyebrow">Facebook event helper</p>
          <h3>Create a draft class from Facebook copy</h3>
        </div>
      </div>
      <p className="panel-copy" style={{ margin: 0 }}>
        This is the safest beta path right now. Paste the Facebook event text, and WSA will build a draft class for you to review before publishing.
      </p>
      <label>
        Facebook page or event URL
        <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder={WSA_FACEBOOK_URL} />
      </label>
      <label>
        Pasted Facebook event text
        <textarea
          rows={8}
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          placeholder="Paste the event title, date, time, location, and description from Facebook here."
        />
      </label>
      <div className="cta-row">
        <button
          type="button"
          className="button button-primary"
          disabled={isPending}
          onClick={() => {
            setError("");
            setMessage("");

            startTransition(async () => {
              try {
                const parsed = parseFacebookClassImport(sourceText, sourceUrl.trim() || undefined);
                const response = await fetch("/api/admin/classes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...parsed,
                    age_min: 5,
                    age_max: 12,
                    price_cents: 0,
                    max_capacity: 12,
                    spots_remaining: 12,
                    what_to_bring: "",
                    weather_note: "",
                    waiver_required: true,
                    status: "draft"
                  })
                });

                const payload = (await response.json()) as { id?: string; error?: string };
                if (!response.ok || payload.error || !payload.id) {
                  throw new Error(payload.error || "Could not create the class draft.");
                }

                setMessage("Draft class created. Opening it now so you can review the details.");
                router.push(`/admin/classes/${payload.id}/edit`);
                router.refresh();
              } catch (nextError) {
                setError(nextError instanceof Error ? nextError.message : "Could not create the class draft.");
              }
            });
          }}
        >
          {isPending ? "Creating draft..." : "Create draft from Facebook copy"}
        </button>
        <a className="button button-ghost" href={WSA_FACEBOOK_URL} target="_blank" rel="noreferrer">
          Open Facebook Page
        </a>
      </div>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
