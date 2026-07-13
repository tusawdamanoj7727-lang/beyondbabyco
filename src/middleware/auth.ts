import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { appUrlMatchesOrigin } from "@/lib/app-url";
import { isSupabaseConfigured, env } from "@/lib/env";
import { isStaffRole, normalizeRole } from "@/lib/auth/roles";
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

const CUSTOMER_PROTECTED_PREFIXES = ["/account", "/checkout"] as const;

/** Post-payment recovery — public without login; order details stay behind /account. */
const PUBLIC_CHECKOUT_PATHS = new Set(["/checkout/failure"]);

function isAuthSensitivePath(pathname: string): boolean {
  return (
    pathname === "/admin/login" ||
    AUTH_SENSITIVE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix),
    )
  );
}

function isCustomerProtectedPath(pathname: string): boolean {
  if (PUBLIC_CHECKOUT_PATHS.has(pathname)) return false;
  return CUSTOMER_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** True when a Supabase auth session cookie is present on the request. */
function hasSupabaseAuthCookies(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth"),
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

async function staffMayAccessAdmin(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string,
): Promise<boolean> {
  const [{ data: roleName }, { data: profile }] = await Promise.all([
    supabase.rpc("current_user_role"),
    supabase.from("profiles").select("is_active").eq("id", userId).maybeSingle(),
  ]);

  const role = normalizeRole(roleName);
  return isStaffRole(role) && profile?.is_active !== false;
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
  const hasAuthCookies = hasSupabaseAuthCookies(request);

  if (!isSupabaseConfigured()) {
    if (isAdminRoute && !isPublicAdminPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  // Protected routes without a session cookie — redirect without calling Auth API.
  if (isCustomerProtectedPath(pathname) && !hasAuthCookies) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && !isPublicAdminPath && !hasAuthCookies) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Public storefront pages with no auth cookie skip JWT validation (lower TTFB).
  const needsSessionValidation =
    hasAuthCookies ||
    isCustomerProtectedPath(pathname) ||
    (isAdminRoute && !isPublicAdminPath) ||
    pathname === "/admin/login";

  if (!needsSessionValidation) {
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

  // IMPORTANT: getUser() validates the JWT with Supabase Auth — never trust getSession() alone.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isCustomerProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && !isPublicAdminPath) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    const allowed = await staffMayAccessAdmin(supabase, user.id);
    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "staff_required");
      return NextResponse.redirect(url);
    }
  }

  if (user && pathname === "/admin/login") {
    const allowed = await staffMayAccessAdmin(supabase, user.id);
    if (allowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
