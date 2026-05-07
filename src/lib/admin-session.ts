import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const ADMIN_SESSION_COOKIE = "wsa-admin-session";

type AdminSessionPayload = {
  username: string;
  exp: number;
};

const MIN_ADMIN_SECRET_LENGTH = 32;

function requireAdminEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Admin access is not configured. Set ${name} before using the WSA admin portal.`);
  }

  return value;
}

export function getAdminCredentialConfig() {
  const username = requireAdminEnv("WSA_ADMIN_USERNAME");
  const password = requireAdminEnv("WSA_ADMIN_PASSWORD");
  const sessionSecret = requireAdminEnv("WSA_ADMIN_SESSION_SECRET");

  if (sessionSecret.length < MIN_ADMIN_SECRET_LENGTH) {
    throw new Error(`Admin access is not configured. WSA_ADMIN_SESSION_SECRET must be at least ${MIN_ADMIN_SECRET_LENGTH} characters.`);
  }

  const parsedSessionHours = Number.parseInt(process.env.WSA_ADMIN_SESSION_HOURS || "12", 10);
  const sessionHours = Number.isFinite(parsedSessionHours)
    ? Math.min(Math.max(parsedSessionHours, 1), 24)
    : 12;

  return {
    username,
    password,
    sessionSecret,
    sessionHours,
  };
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value: string) {
  const { sessionSecret } = getAdminCredentialConfig();
  return createHmac("sha256", sessionSecret).update(value).digest("base64url");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminCredentials(input: { username: string; password: string }) {
  const config = getAdminCredentialConfig();
  const usernameMatches = safeCompare(
    input.username.trim().toLowerCase(),
    config.username.trim().toLowerCase(),
  );
  const passwordMatches = safeCompare(input.password, config.password);

  return usernameMatches && passwordMatches;
}

export function createAdminSessionToken(username: string) {
  const { sessionHours } = getAdminCredentialConfig();
  const payload: AdminSessionPayload = {
    username,
    exp: Date.now() + sessionHours * 60 * 60 * 1000,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined | null) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  try {
    const expectedSignature = signValue(encodedPayload);
    if (!safeCompare(signature, expectedSignature)) {
      return null;
    }

    const payload = JSON.parse(fromBase64Url(encodedPayload)) as AdminSessionPayload;
    if (!payload.username || !payload.exp || payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function readAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export function getAdminSessionCookieOptions(maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge:
      maxAgeSeconds ??
      getAdminCredentialConfig().sessionHours * 60 * 60,
  };
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Admin access needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY configured on the server.",
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
