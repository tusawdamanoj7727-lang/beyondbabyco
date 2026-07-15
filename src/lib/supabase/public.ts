import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env, isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/env";
import { secrets } from "@/lib/security/secrets";
import type { Database } from "./types";

/**
 * Cookie-free Supabase client for public catalog/CMS reads.
 * Prefer service role when available (stable RLS bypass for cached payloads);
 * fall back to the anon key so public tables remain readable without session cookies.
 *
 * Using this (instead of createSupabaseServerClient) keeps storefront routes
 * eligible for ISR / unstable_cache and avoids Auth cookie work on every TTFB.
 */
export function createSupabasePublicClient(): SupabaseClient<Database> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const key = isServiceRoleConfigured()
    ? secrets.supabaseServiceRoleKey
    : env.supabaseAnonKey;

  return createClient<Database>(env.supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
