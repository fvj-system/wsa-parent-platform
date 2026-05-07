import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

const ADMIN_SESSION_COOKIE = "wsa-admin-session";

const PUBLIC_ROUTES = [
  "/",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/classes",
  "/parents",
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function getSafeNextPath(value: string | null) {
  if (!value) return "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "";
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasAdminSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  // Allow static files to pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const publicRoute = isPublicRoute(pathname);

  if (pathname.startsWith("/admin") && hasAdminSession) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: CookieOptions;
          }>,
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !publicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("redirectedFrom");
    if (hasAdminSession) {
      url.pathname = "/admin";
    }
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/auth/sign-in") {
    const url = request.nextUrl.clone();
    url.pathname = getSafeNextPath(request.nextUrl.searchParams.get("next")) || "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
