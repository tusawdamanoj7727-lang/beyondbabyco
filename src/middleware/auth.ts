import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { appUrlMatchesOrigin } from "@/lib/app-url";
import { isSupabaseConfigured, env } from "@/lib/env";
import { isRole, isStaffRole } from "@/lib/auth/roles";
import type { Database } from "@/lib/supabase/types";

/** Admin routes that must remain reachable without a session. */
const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/admin/logout"]);

const AUTH_SENSITIVE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/",
] as const;

function isAuthSensitivePath(pathname: string): boolean {
  return (
    pathname === "/admin/login" ||
    AUTH_SENSITIVE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix),
    )
  );
}

/** Dev-only: redirect auth flows when NEXT_PUBLIC_APP_URL does not match request origin. */
function devAppUrlMismatchRedirect(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (!isAuthSensitivePath(request.nextUrl.pathname)) return null;
  if (request.nextUrl.pathname.startsWith("/auth/callback")) return null;

  const origin = request.nextUrl.origin;
  if (appUrlMatchesOrigin(origin)) return null;

  console.error(
    `[middleware/auth] APP_URL mismatch: request origin=${origin} does not match NEXT_PUBLIC_APP_URL — run npm run check:auth`,
  );

  const url = request.nextUrl.clone();
  url.pathname = request.nextUrl.pathname.startsWith("/admin") ? "/admin/login" : "/login";
  url.search = "";
  url.searchParams.set("error", "app_url_mismatch");
  return NextResponse.redirect(url);
}

/**
 * Refreshes Supabase session cookies on every matched request and guards /admin.
 */
export async function updateSessionAndGuard(
  request: NextRequest,
): Promise<NextResponse> {
  const mismatch = devAppUrlMismatchRedirect(request);
  if (mismatch) return mismatch;

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.has(pathname);

  if (!isSupabaseConfigured()) {
    if (isAdminRoute && !isPublicAdminPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() validates the token and refreshes cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminRoute && !isPublicAdminPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/admin/login") {
    const { data: roleName } = await supabase.rpc("current_user_role");
    const role = isRole(roleName) ? roleName : null;

    // Only skip login for staff — prevents redirect loop for non-staff sessions.
    if (isStaffRole(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
