/**
 * Centralized access to public Supabase environment variables.
 *
 * Getters throw only when Supabase is required for the current operation.
 * Use `isSupabaseConfigured()` in middleware and other early paths so missing
 * env never crashes the dev server or public admin login page.
 */
import { validatePublicEnv } from "./env.validation";

function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to your .env.local file.`,
    );
  }

  return value;
}

/** True when both public Supabase vars are set to real (non-empty, non-placeholder) values. */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) return false;
  if (url.includes("your-project") || key.includes("your-anon-key")) return false;

  try {
    new URL(url);
  } catch {
    return false;
  }

  return true;
}

/** True when the service role key is set (server-side operations / bootstrap checks). */
export function isServiceRoleConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return false;
  return !key.includes("your-service-role-key");
}

export const env = {
  get supabaseUrl(): string {
    return requireEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get supabaseAnonKey(): string {
    return requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
  /** Call at app startup / health checks to validate public env shape. */
  validate(): void {
    validatePublicEnv();
  },
  isConfigured: isSupabaseConfigured,
};
