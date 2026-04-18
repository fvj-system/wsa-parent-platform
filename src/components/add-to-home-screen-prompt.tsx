"use client";

import { useEffect, useMemo, useState } from "react";

const DISMISS_KEY = "wsa-a2hs-dismissed-at";
const INSTALLED_KEY = "wsa-a2hs-installed";
const REMIND_AFTER_MS = 1000 * 60 * 60 * 24 * 7;
const SHOW_DELAY_MS = 2200;

type InstallPromptPlatform = "android" | "ios";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobileSized() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 820px)").matches;
}

function shouldPausePrompting() {
  if (typeof window === "undefined") return true;

  if (window.localStorage.getItem(INSTALLED_KEY) === "true") {
    return true;
  }

  const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) ?? "0");
  if (!dismissedAt) return false;

  return Date.now() - dismissedAt < REMIND_AFTER_MS;
}

function getMobilePlatform(): InstallPromptPlatform | null {
  if (typeof window === "undefined") return null;

  const ua = window.navigator.userAgent.toLowerCase();
  const isIosDevice = /iphone|ipad|ipod/.test(ua);
  const isAndroidDevice = /android/.test(ua);
  const isSafari = /safari/.test(ua) && !/crios|fxios|edgios|opr\//.test(ua);

  if (isAndroidDevice) return "android";
  if (isIosDevice && isSafari) return "ios";
  return null;
}

export function AddToHomeScreenPrompt() {
  const [platform, setPlatform] = useState<InstallPromptPlatform | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Safe no-op: if this fails, the manual iPhone flow still works.
      });
    }

    if (isStandaloneMode() || !isMobileSized() || shouldPausePrompting()) {
      return;
    }

    const detectedPlatform = getMobilePlatform();
    setPlatform(detectedPlatform);

    if (detectedPlatform === "ios") {
      const timer = window.setTimeout(() => {
        setIsVisible(true);
      }, SHOW_DELAY_MS);

      return () => window.clearTimeout(timer);
    }

    function handleBeforeInstallPrompt(event: Event) {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);

      window.setTimeout(() => {
        if (!shouldPausePrompting() && !isStandaloneMode() && isMobileSized()) {
          setPlatform("android");
          setIsVisible(true);
        }
      }, SHOW_DELAY_MS);
    }

    function handleAppInstalled() {
      window.localStorage.setItem(INSTALLED_KEY, "true");
      setDeferredPrompt(null);
      setIsVisible(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const bodyCopy = useMemo(() => {
    if (platform === "ios") {
      return "Open it like a regular app next time. Use Share, then tap Add to Home Screen.";
    }

    return "Open it like a regular app next time with one tap from your phone home screen.";
  }, [platform]);

  if (!isVisible || !platform) {
    return null;
  }

  return (
    <aside className="a2hs-prompt" role="dialog" aria-label="Add Wild Stallion Academy to your home screen">
      <div className="a2hs-prompt-copy">
        <p className="eyebrow">Wild Stallion Academy</p>
        <h3>Add Wild Stallion Academy to your home screen</h3>
        <p className="panel-copy" style={{ marginBottom: 0 }}>
          {bodyCopy}
        </p>
        {platform === "ios" ? (
          <ol className="a2hs-steps">
            <li>Tap the Share button in Safari.</li>
            <li>Tap <strong>Add to Home Screen</strong>.</li>
          </ol>
        ) : null}
      </div>

      <div className="a2hs-prompt-actions">
        {platform === "android" && deferredPrompt ? (
          <button
            type="button"
            className="button button-primary"
            disabled={isInstalling}
            onClick={() => {
              if (!deferredPrompt) return;

              setIsInstalling(true);
              void (async () => {
                await deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice.catch(() => null);

                if (choice?.outcome === "accepted") {
                  window.localStorage.setItem(INSTALLED_KEY, "true");
                } else {
                  window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
                }

                setDeferredPrompt(null);
                setIsVisible(false);
                setIsInstalling(false);
              })();
            }}
          >
            {isInstalling ? "Opening..." : "Add to Home Screen"}
          </button>
        ) : null}

        <button
          type="button"
          className="button button-ghost"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
            }
            setIsVisible(false);
          }}
        >
          Not now
        </button>
      </div>
    </aside>
  );
}
