import type { AuthError } from "@supabase/supabase-js";

/** Map Supabase Auth errors to accurate, user-safe messages. */
export function mapSupabaseAuthError(error: AuthError | null | undefined): string {
  if (!error) return "Authentication failed. Please try again.";

  const code = (error.code ?? "").toLowerCase();
  const msg = error.message.toLowerCase();

  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return "Please confirm your email before signing in. Check your inbox for the confirmation link.";
  }

  if (
    code === "invalid_credentials" ||
    code === "invalid_grant" ||
    msg.includes("invalid login credentials") ||
    msg.includes("invalid email or password")
  ) {
    return "Incorrect email or password.";
  }

  if (code === "user_banned" || msg.includes("user is banned") || msg.includes("account disabled")) {
    return "This account has been disabled. Contact support for help.";
  }

  if (code === "over_request_rate_limit" || msg.includes("too many requests")) {
    return "Too many sign-in attempts. Please wait a few minutes and try again.";
  }

  if (code === "session_expired" || msg.includes("session expired") || msg.includes("jwt expired")) {
    return "Your session expired. Please sign in again.";
  }

  if (msg.includes("oauth") && (msg.includes("cancel") || msg.includes("denied"))) {
    return "Sign in was cancelled. Please try again.";
  }

  if (msg.includes("signup disabled")) {
    return "New account registration is temporarily unavailable.";
  }

  if (msg.includes("already registered") || msg.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (msg.includes("password") && msg.includes("weak")) {
    return "Password is too weak. Use at least 6 characters.";
  }

  return error.message || "Authentication failed. Please try again.";
}

/** Callback route error codes → login page messages. */
export const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed: "We couldn't complete sign in. The link may have expired — please try again.",
  auth_callback_exchange_failed:
    "We couldn't verify your sign-in link. Request a new confirmation or password reset email.",
  auth_callback_missing_code: "The sign-in link was incomplete. Please use the link from your latest email.",
  auth_callback_oauth_denied: "Sign in was cancelled or denied by the provider.",
  app_url_mismatch:
    "Server URL mismatch. Set NEXT_PUBLIC_APP_URL in .env.local to match your dev port and run npm run check:auth.",
  auth_callback_profile_failed:
    "Sign in succeeded but your profile could not be created. Contact support if this persists.",
  reset_session_expired: "Your reset link expired. Request a new password reset email.",
};

export function callbackErrorMessage(code: string, providerDescription?: string | null): string {
  if (providerDescription?.trim()) {
    return providerDescription.trim();
  }
  return CALLBACK_ERROR_MESSAGES[code] ?? "Authentication failed. Please try again.";
}
