"use client";

import { createBrowserClient } from "@supabase/ssr";

import { env } from "../env";
import type { Database } from "./types";

/**
 * Creates a cookie-aware Supabase browser client.
 *
 * The browser client reads/writes the same auth cookies the server and
 * middleware use, keeping client-side auth state in sync with the session.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}

/**
 * Shared singleton browser client. Safe to import from Client Components.
 */
export const supabase = createSupabaseBrowserClient();
