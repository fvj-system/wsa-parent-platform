import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminClient,
  createAdminSessionToken,
  getAdminCredentialConfig,
  getAdminSessionCookieOptions,
  verifyAdminCredentials,
} from "@/lib/admin-session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = String(body.username || "");
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Enter your admin username and password." },
        { status: 400 },
      );
    }

    if (!verifyAdminCredentials({ username, password })) {
      return NextResponse.json(
        { error: "That staff login did not match our beta admin credentials." },
        { status: 401 },
      );
    }

    createAdminClient();

    const token = createAdminSessionToken(getAdminCredentialConfig().username);
    const response = NextResponse.json({ ok: true, redirectTo: "/admin" });
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      token,
      getAdminSessionCookieOptions(),
    );
    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Admin sign-in could not be completed right now.";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
