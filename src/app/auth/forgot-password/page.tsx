"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const RESET_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isPending, startTransition] = useTransition();
  const hasSubmittedSuccessfully = message.length > 0;

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownRemaining((current) => (current > 1 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownRemaining]);

  const handleResetRequest = (emailValue: string, onSuccess?: () => void) => {
    if (isPending || cooldownRemaining > 0) {
      return;
    }

    setError("");
    setMessage("");

    startTransition(async () => {
      const supabase = createClient();
      // localhost reset links only work on the same computer.
      // For phone testing, use your LAN URL; for production, use your deployed HTTPS domain.
      const redirectUrl =
        process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT_URL || `${window.location.origin}/reset-password`;
      if (process.env.NODE_ENV !== "production") {
        console.log("Reset redirect URL:", redirectUrl);
      }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: redirectUrl
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSubmittedEmail(emailValue);
      setCooldownRemaining(RESET_COOLDOWN_SECONDS);
      setMessage("Check your email for a reset link.");
      onSuccess?.();
    });
  };

  return (
    <main className="shell">
      <section className="auth-card">
        <p className="eyebrow">Reset password</p>
        <h2>Send a password reset link</h2>
        <p className="panel-copy">
          Enter the email on your account and we&apos;ll send you a secure reset link.
        </p>

        {hasSubmittedSuccessfully ? (
          <div className="stack">
            <p className="success">{message}</p>
            <p className="muted">
              {submittedEmail ? `We sent the reset link to ${submittedEmail}.` : "Open the email on this device if possible."}
            </p>
            <p className="muted">
              {cooldownRemaining > 0
                ? `You can request another reset link in ${cooldownRemaining}s.`
                : "You can request another reset link now if you still need one."}
            </p>
            <button
              type="button"
              disabled={isPending || cooldownRemaining > 0 || !submittedEmail}
              onClick={() => handleResetRequest(submittedEmail)}
            >
              {isPending ? "Sending..." : cooldownRemaining > 0 ? `Retry in ${cooldownRemaining}s` : "Send another reset link"}
            </button>
            {error ? <p className="error">{error}</p> : null}
          </div>
        ) : (
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              handleResetRequest(email.trim(), () => setEmail(""));
            }}
          >
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button type="submit" disabled={isPending || cooldownRemaining > 0 || email.trim().length === 0}>
              {isPending ? "Sending..." : "Send reset link"}
            </button>
            {error ? <p className="error">{error}</p> : null}
          </form>
        )}

        <p className="muted">
          Remembered it? <Link href="/">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}
