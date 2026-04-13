"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD_LENGTH = 10;

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function prepareRecoverySession() {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          setError("This reset link is invalid or expired. Request a new password reset email.");
          setIsReady(false);
          return;
        }

        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("This reset link is invalid or expired. Request a new password reset email.");
        setIsReady(false);
        return;
      }

      setIsReady(true);
    }

    void prepareRecoverySession();
  }, []);

  return (
    <main className="shell">
      <section className="auth-card">
        <p className="eyebrow">Reset password</p>
        <h2>Create a new password</h2>
        <p className="panel-copy">
          Choose a new password for your account. For security, we never show or retrieve old passwords.
        </p>

        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            setMessage("");
            const formData = new FormData(event.currentTarget);
            const password = String(formData.get("password") || "");
            const confirmPassword = String(formData.get("confirmPassword") || "");

            if (password.length < MIN_PASSWORD_LENGTH) {
              setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
              return;
            }

            if (password !== confirmPassword) {
              setError("Passwords do not match.");
              return;
            }

            startTransition(async () => {
              const supabase = createClient();
              const { error: updateError } = await supabase.auth.updateUser({ password });

              if (updateError) {
                setError(updateError.message);
                return;
              }

              setMessage("Password updated. Redirecting you back to sign in...");
              setTimeout(() => {
                router.push("/?reset=success");
                router.refresh();
              }, 1200);
            });
          }}
        >
          <label>
            New password
            <input name="password" type="password" minLength={MIN_PASSWORD_LENGTH} required disabled={!isReady || isPending} />
          </label>
          <label>
            Confirm new password
            <input
              name="confirmPassword"
              type="password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              disabled={!isReady || isPending}
            />
          </label>
          <button type="submit" disabled={!isReady || isPending}>
            {isPending ? "Updating..." : "Update password"}
          </button>
          {message ? <p className="success">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </form>

        <p className="muted">
          Need a new link? <Link href="/auth/forgot-password">Request another reset email</Link>
        </p>
      </section>
    </main>
  );
}
