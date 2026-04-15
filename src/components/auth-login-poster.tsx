"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./auth-login-poster.module.css";

const REMEMBER_DEVICE_KEY = "wsa-remember-device";
const REMEMBERED_EMAIL_KEY = "wsa-remembered-email";

type AuthLoginPosterProps = {
  mode?: "root";
};

export function AuthLoginPoster({ mode = "root" }: AuthLoginPosterProps) {
  const [authMode, setAuthMode] = useState<"family" | "admin">("family");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState("Admin");
  const [adminPassword, setAdminPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetMessage =
    searchParams.get("reset") === "success"
      ? "Password updated. Sign in with your new password."
      : "";
  const confirmationMessage =
    searchParams.get("confirmed") === "1"
      ? "Email confirmed. You can sign in now."
      : "";
  const inviteToken = searchParams.get("invite") ?? "";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const remembered = window.localStorage.getItem(REMEMBER_DEVICE_KEY);
    const rememberedEmail = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
    const shouldRemember = remembered !== "false";

    setRememberDevice(shouldRemember);
    if (shouldRemember && rememberedEmail) {
      setEmail(rememberedEmail);
    }
  }, []);

  return (
    <main className={styles.page}>
      <div
        className={styles.backdrop}
        aria-hidden="true"
        style={{
          backgroundImage: "url(/background.jpeg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className={`${styles.glow} ${styles.glowTop}`} />
        <div className={`${styles.glow} ${styles.glowBottom}`} />
        <div className={styles.landscape}>
          <span className={`${styles.ridge} ${styles.ridgeFar}`} />
          <span className={`${styles.ridge} ${styles.ridgeMid}`} />
          <span className={`${styles.ridge} ${styles.ridgeNear}`} />
          <span className={styles.trees} />
          <span className={styles.water} />
        </div>
      </div>

      <section className={styles.shell}>
        <article className={styles.card}>
          <div className={styles.cardInner}>
            <p className={styles.kicker}>Wild Stallion Academy</p>
            <h1 className={styles.title}>Wild Stallion Academy</h1>
            <div className={`wood-banner ${styles.banner}`}>Parent Portal</div>
            <p className={styles.copy}>
              {authMode === "family"
                ? "Sign in to access your family dashboard, planner, badges, and Wild Stallion Academy tools."
                : "Staff access opens the beta admin portal for class operations and WSA management."}
            </p>

            <div className={styles.modeRow}>
              <button
                type="button"
                className={`${styles.modeButton} ${authMode === "family" ? styles.modeButtonActive : styles.modeButtonIdle}`}
                onClick={() => {
                  setAuthMode("family");
                  setError("");
                }}
              >
                Family login
              </button>
              <button
                type="button"
                className={`${styles.modeButton} ${authMode === "admin" ? styles.modeButtonActive : styles.modeButtonIdle}`}
                onClick={() => {
                  setAuthMode("admin");
                  setError("");
                }}
              >
                Staff access
              </button>
            </div>

            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();
                setError("");

                startTransition(async () => {
                  if (authMode === "admin") {
                    const response = await fetch("/api/admin/login", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        username: adminUsername,
                        password: adminPassword,
                      }),
                    });
                    const payload = (await response.json().catch(() => ({}))) as {
                      error?: string;
                      redirectTo?: string;
                    };

                    if (!response.ok) {
                      setError(payload.error || "Staff access could not be opened.");
                      return;
                    }

                    router.push(payload.redirectTo || "/admin");
                    router.refresh();
                    return;
                  }

                  const supabase = createClient();
                  const { error: signInError } =
                    await supabase.auth.signInWithPassword({
                      email,
                      password,
                    });

                  if (signInError) {
                    setError(signInError.message);
                    return;
                  }

                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(
                      REMEMBER_DEVICE_KEY,
                      rememberDevice ? "true" : "false",
                    );

                    if (rememberDevice) {
                      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
                    } else {
                      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
                    }
                  }

                  router.push(inviteToken ? `/household?invite=${encodeURIComponent(inviteToken)}` : "/dashboard");
                  router.refresh();
                });
              }}
            >
              {authMode === "family" ? (
                <>
                  <label>
                    Email Address
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>

                  <label>
                    Password
                    <input
                      name="password"
                      type="password"
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>

                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(event) => setRememberDevice(event.target.checked)}
                    />
                    <span>Remember this device</span>
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Admin username
                    <input
                      name="username"
                      type="text"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      value={adminUsername}
                      onChange={(event) => setAdminUsername(event.target.value)}
                    />
                  </label>

                  <label>
                    Admin password
                    <input
                      name="adminPassword"
                      type="password"
                      required
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                    />
                  </label>

                  <p className={styles.adminHint}>
                    Beta staff access is separate from the normal family sign-in.
                  </p>
                </>
              )}

              <button
                className={`button button-primary ${styles.submit}`}
                type="submit"
                disabled={isPending}
              >
                {isPending
                  ? authMode === "admin"
                    ? "Opening Admin..."
                    : "Signing In..."
                  : authMode === "admin"
                    ? "Open Admin Portal"
                    : "Sign In"}
              </button>

              {resetMessage ? <p className="success">{resetMessage}</p> : null}
              {confirmationMessage ? <p className="success">{confirmationMessage}</p> : null}
              {inviteToken && authMode === "family" ? <p className="success">You were invited to join a shared family household. Sign in to accept it.</p> : null}
              {error ? <p className="error">{error}</p> : null}
            </form>

            {authMode === "family" ? (
              <div className={styles.links}>
                <Link href="/auth/forgot-password">Forgot password?</Link>
                <Link href={inviteToken ? `/auth/sign-up?invite=${encodeURIComponent(inviteToken)}` : "/auth/sign-up"}>
                  Create family account
                </Link>
              </div>
            ) : (
              <div className={styles.links}>
                <button
                  type="button"
                  className={styles.staffBackLink}
                  onClick={() => {
                    setAuthMode("family");
                    setError("");
                  }}
                >
                  Back to family login
                </button>
              </div>
            )}

            <p className={styles.tagline}>
              At WSA, we explore with courage, learn with humility, and lead
              with respect.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
