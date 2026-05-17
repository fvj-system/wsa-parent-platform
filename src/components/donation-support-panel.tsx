"use client";

import { useMemo, useState, useTransition } from "react";

type DonationSupportPanelProps = {
  success?: boolean;
  canceled?: boolean;
};

const presetAmounts = [5, 10, 25, 50] as const;

export function DonationSupportPanel({
  success = false,
  canceled = false,
}: DonationSupportPanelProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const amountDollars = useMemo(() => {
    const parsedCustom = Number(customAmount);
    if (Number.isFinite(parsedCustom) && parsedCustom >= 1) {
      return Math.round(parsedCustom * 100) / 100;
    }

    return selectedAmount;
  }, [customAmount, selectedAmount]);

  return (
    <section className="content-grid">
      <article className="panel stack">
        <div>
          <p className="eyebrow">Support WSA</p>
          <h3>Make a small family donation</h3>
          <p className="panel-copy" style={{ marginBottom: 0 }}>
            Donations help keep classes, field tools, homeschool planning, and
            family adventures growing without making the app harder to use.
          </p>
        </div>

        {success ? (
          <p className="success">
            Thank you. Your donation checkout finished successfully.
          </p>
        ) : null}
        {canceled ? (
          <p className="error">
            Donation checkout was canceled before payment finished.
          </p>
        ) : null}

        <div className="cta-row">
          {presetAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              className={`button ${!customAmount && selectedAmount === amount ? "button-primary" : "button-ghost"}`}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount("");
              }}
            >
              ${amount}
            </button>
          ))}
        </div>

        <label>
          Or choose a custom amount
          <input
            inputMode="decimal"
            placeholder="15.00"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value.replace(/[^\d.]/g, ""))}
          />
        </label>

        <button
          type="button"
          className="button button-primary"
          disabled={isPending}
          onClick={() => {
            setError("");

            startTransition(async () => {
              const response = await fetch("/api/donations/checkout", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ amountDollars }),
              });

              const payload = (await response.json().catch(() => ({}))) as {
                error?: string;
                url?: string;
              };

              if (!response.ok || !payload.url) {
                setError(payload.error || "Could not start donation checkout.");
                return;
              }

              window.location.href = payload.url;
            });
          }}
        >
          {isPending ? "Opening checkout..." : `Donate $${amountDollars.toFixed(2)}`}
        </button>

        {error ? <p className="error">{error}</p> : null}
      </article>

      <article className="panel stack">
        <div>
          <p className="eyebrow">What it supports</p>
          <h3>Keep WSA adventurous and useful</h3>
        </div>
        <ul className="chip-list">
          <li>Outdoor class planning and updates</li>
          <li>Family dashboard and planner tools</li>
          <li>Regional geocache trail growth</li>
          <li>Homeschool documentation features</li>
        </ul>
        <p className="muted" style={{ margin: 0 }}>
          This opens a secure Stripe checkout. No donation amounts are charged
          unless payment is completed there.
        </p>
      </article>
    </section>
  );
}
