import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env, isSupabaseConfigured } from "../env";
import type { Database } from "./types";

/**
 * Creates a cookie-aware Supabase client for server-side usage in the App
 * Router (Server Components, Route Handlers, Server Actions).
 *
 * Reads and writes the secure auth cookies managed by `@supabase/ssr`.
 * When called from a Server Component, cookie writes are a no-op (Next.js
 * forbids mutating cookies during render) — the middleware refreshes the
 * session instead, so this is safe.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component render — ignore.
        }
      },
    },
  });
}

/** Alias for sitemap and other metadata routes. */
export const createClient = createSupabaseServerClient;
