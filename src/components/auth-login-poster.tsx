"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./auth-login-poster.module.css";

const REMEMBER_DEVICE_KEY = "wsa-remember-device";
const REMEMBERED_EMAIL_KEY = "wsa-remembered-email";

type AuthLoginPosterProps = {
  mode?: "root" | "sign-in";
};

export function AuthLoginPoster({ mode = "root" }: AuthLoginPosterProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
              Sign in to access your family dashboard, planner, badges, and Wild
              Stallion Academy tools.
            </p>

            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();
                setError("");

                startTransition(async () => {
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

                  router.push("/dashboard");
                  router.refresh();
                });
              }}
            >
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

              <button
                className={`button button-primary ${styles.submit}`}
                type="submit"
                disabled={isPending}
              >
                {isPending ? "Signing In..." : "Sign In"}
              </button>

              {resetMessage ? <p className="success">{resetMessage}</p> : null}
              {confirmationMessage ? <p className="success">{confirmationMessage}</p> : null}
              {error ? <p className="error">{error}</p> : null}
            </form>

            <div className={styles.links}>
              <Link href="/auth/forgot-password">Forgot password?</Link>
              {mode === "sign-in" ? (
                <Link href="/">Back to home sign in</Link>
              ) : (
                <Link href="/auth/sign-up">Create family account</Link>
              )}
            </div>

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
