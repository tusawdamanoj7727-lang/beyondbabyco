import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { assertAppUrlMatchesOrigin } from "@/lib/app-url";
import { ensureCustomerRecordsForUser } from "@/lib/auth/customer-bootstrap";
import { shouldSendOAuthWelcomeEmail } from "@/lib/checkout/commerce-stability";
import { onNewCustomer } from "@/lib/email/events/admin";
import { env, isSupabaseConfigured } from "@/lib/env";
import { resolveCustomerRedirect } from "@/lib/routes";
import type { Database } from "@/lib/supabase/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function resolvePostAuthRedirect(
  origin: string,
  type: string | null,
  next: string,
): URL {
  if (type === "recovery") {
    return new URL("/reset-password", origin);
  }
  if (type === "signup" || type === "email") {
    return new URL("/account?verified=1", origin);
  }
  return new URL(resolveCustomerRedirect(next), origin);
}

function loginErrorRedirect(origin: string, errorCode: string): NextResponse {
  const url = new URL("/login", origin);
  url.searchParams.set("error", errorCode);
  return NextResponse.redirect(url);
}

function appUrlMismatchRedirect(origin: string, message: string): NextResponse {
  console.error(`[auth/callback] ${message}`);
  const url = new URL("/login", origin);
  url.searchParams.set("error", "app_url_mismatch");
  url.searchParams.set("reason", message.slice(0, 180));
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/account";
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (providerError) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "auth_callback_oauth_denied");
    if (providerError.length < 200) {
      url.searchParams.set("reason", providerError);
    }
    return NextResponse.redirect(url);
  }

  if (!isSupabaseConfigured()) {
    return loginErrorRedirect(origin, "auth_callback_failed");
  }

  try {
    assertAppUrlMatchesOrigin(origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : "APP_URL mismatch";
    return appUrlMismatchRedirect(origin, message);
  }

  if (!code && !(tokenHash && type)) {
    return loginErrorRedirect(origin, "auth_callback_missing_code");
  }

  const redirectUrl = resolvePostAuthRedirect(origin, type, next);
  const response = NextResponse.redirect(redirectUrl);

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            /* route handler — cookieStore writes are allowed */
          }
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let sessionUser = null;

  if (code) {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data.session) {
      console.error("[auth/callback] exchangeCodeForSession failed:", exchangeError?.message);
      return loginErrorRedirect(origin, "auth_callback_exchange_failed");
    }

    sessionUser = data.user;
  } else if (tokenHash && type) {
    const otpType = type as EmailOtpType;
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });

    if (verifyError || !data.session) {
      console.error("[auth/callback] verifyOtp failed:", verifyError?.message);
      return loginErrorRedirect(origin, "auth_callback_exchange_failed");
    }

    sessionUser = data.user;
  }

  if (sessionUser) {
    try {
      const supabaseUserClient = await createSupabaseServerClient();
      const { data: existingCustomer } = await supabaseUserClient
        .from("customers")
        .select("id")
        .eq("profile_id", sessionUser.id)
        .maybeSingle();

      const customerId = await ensureCustomerRecordsForUser(sessionUser);
      if (
        customerId &&
        shouldSendOAuthWelcomeEmail(Boolean(existingCustomer))
      ) {
        await onNewCustomer(customerId);
      }
    } catch (err) {
      console.warn("[auth/callback] customer bootstrap skipped:", err);
    }
  }

  return response;
}
