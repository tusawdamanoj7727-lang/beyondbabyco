import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env, isServiceRoleConfigured } from "@/lib/env";
import { secrets } from "@/lib/security/secrets";
import type { Database } from "./types";

/** Service-role Supabase client for webhooks, cron, and background jobs. */
export function createSupabaseServiceClient() {
  if (!isServiceRoleConfigured()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient<Database>(env.supabaseUrl, secrets.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
