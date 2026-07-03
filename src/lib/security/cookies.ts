/**
 * Secure cookie defaults for production.
 * Supabase SSR manages auth cookies; these are recommended options for custom cookies.
 */
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function getSessionCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: maxAgeSeconds,
  };
}
