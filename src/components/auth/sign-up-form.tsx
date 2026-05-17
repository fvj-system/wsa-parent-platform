"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SignUpFormProps = {
  inviteToken?: string;
  nextPath?: string;
  questSlug?: string;
};

export function SignUpForm({ inviteToken = "", nextPath = "", questSlug = "" }: SignUpFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <main className="shell">
      <section className="auth-card">
        <p className="eyebrow">Create account</p>
        <h2>Start your WSA family portal</h2>
        <p className="panel-copy">
          Create your family login with email and password. If email confirmation is turned on, we will tell you to check your inbox before signing in.
        </p>
        {inviteToken ? (
          <p className="success" style={{ marginTop: 0 }}>
            This signup was opened from a co-parent invite. After your account is ready, you will land on the household invite screen.
          </p>
        ) : nextPath ? (
          <p className="success" style={{ marginTop: 0 }}>
            After your account is ready, you will return to the WSA page you were viewing.
          </p>
        ) : null}

        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            setMessage("");
            const form = event.currentTarget;
            const formData = new FormData(form);

            startTransition(async () => {
              const supabase = createClient();
              const email = String(formData.get("email") || "");
              const password = String(formData.get("password") || "");
              const confirmPassword = String(formData.get("confirmPassword") || "");
              const fullName = String(formData.get("fullName") || "");
              const householdName = String(formData.get("householdName") || "");

              if (password !== confirmPassword) {
                setError("Passwords do not match yet. Please type the same password twice.");
                return;
              }

              const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  emailRedirectTo: `${window.location.origin}/auth/sign-in?confirmed=1${
                    inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""
                  }${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`,
                  data: {
                    full_name: fullName,
                    household_name: householdName,
                  },
                },
              });

              if (signUpError) {
                setError(signUpError.message);
                return;
              }

              if (data.session) {
                if (questSlug) {
                  await fetch("/api/field-quests/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      questSlug,
                      eventType: "signup_completed",
                      metadata: { source: "sign_up_form" },
                    }),
                  }).catch(() => undefined);
                }

                setMessage("Account created. Taking you to your dashboard now.");
                form.reset();
                router.replace(
                  inviteToken ? `/household?invite=${encodeURIComponent(inviteToken)}` : nextPath || "/dashboard",
                );
                router.refresh();
                return;
              }

              setMessage(
                `Account created for ${email}. Check your email for the confirmation link, then come back and sign in.`,
              );
              form.reset();
            });
          }}
        >
          <label>
            Full name
            <input name="fullName" required />
          </label>
          <label>
            Household name
            <input name="householdName" placeholder="Smith family" />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" minLength={10} required />
          </label>
          <label>
            Confirm password
            <input name="confirmPassword" type="password" minLength={10} required />
          </label>
          <button type="submit" disabled={isPending}>
            {isPending ? "Creating account..." : "Create account"}
          </button>
          {message ? <p className="success">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </form>

        <p className="muted">
          Already have an account?{" "}
          <Link
            href={
              inviteToken
                ? `/auth/sign-in?invite=${encodeURIComponent(inviteToken)}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`
                : nextPath
                  ? `/auth/sign-in?next=${encodeURIComponent(nextPath)}`
                  : "/auth/sign-in"
            }
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
