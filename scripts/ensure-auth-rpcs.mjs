#!/usr/bin/env node
/**
 * Ensure auth RPCs exist (006_auth_functions.sql) and current_user_role() works.
 * Requires DATABASE_URL in .env.local for automatic apply.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

import { ADMIN_EMAIL } from "./bootstrap-admin.mjs";
import { loadEnvFile } from "./env-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const AUTH_SQL = resolve(root, "supabase/database/006_auth_functions.sql");

export function loadEnv() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) {
    throw new Error(".env.local missing");
  }
  return loadEnvFile(envPath, readFileSync, existsSync);
}

/** @returns {Promise<{ role: string | null, error: string | null }>} */
export async function probeCurrentUserRole(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anon = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: "Admin@123456",
  });
  if (signErr) {
    return { role: null, error: `signIn: ${signErr.message}` };
  }

  const authed = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${signIn.session.access_token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: roleName, error: rpcErr } = await authed.rpc("current_user_role");
  if (rpcErr) {
    return { role: null, error: rpcErr.message };
  }
  return { role: roleName ?? null, error: null };
}

export async function applyAuthRpcs(env) {
  const dbUrl = env.DATABASE_URL?.trim();
  if (!dbUrl) {
    throw new Error("DATABASE_URL missing");
  }

  const sql = readFileSync(AUTH_SQL, "utf8");
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    await client.query("NOTIFY pgrst, 'reload schema'");
  } finally {
    await client.end().catch(() => {});
  }
}

/**
 * @param {{ silent?: boolean }} [options]
 * @returns {Promise<{ ok: boolean, role: string | null, applied: boolean }>}
 */
export async function ensureAuthRpcs(options = {}) {
  const silent = options.silent === true;
  const env = loadEnv();
  let applied = false;

  let { role, error } = await probeCurrentUserRole(env);
  if (role === "admin") {
    return { ok: true, role, applied };
  }

  const missingRpc = error?.includes("Could not find the function public.current_user_role");
  if (!missingRpc && role !== "admin") {
    return { ok: false, role, applied };
  }

  if (!env.DATABASE_URL?.trim()) {
    if (!silent) {
      console.error("\n✗ current_user_role() RPC is missing from the database.");
      console.error("  Apply migration 006 in Supabase SQL Editor:");
      console.error("    supabase/database/006_auth_functions.sql");
      console.error("\n  Or add DATABASE_URL to .env.local and run:");
      console.error("    npm run repair:auth-rpcs\n");
    }
    return { ok: false, role: null, applied: false };
  }

  await applyAuthRpcs(env);
  applied = true;

  // PostgREST may need a moment after NOTIFY
  for (let i = 0; i < 5; i++) {
    ({ role, error } = await probeCurrentUserRole(env));
    if (role === "admin") break;
    await new Promise((r) => setTimeout(r, 1000));
  }

  return { ok: role === "admin", role, applied };
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  const result = await ensureAuthRpcs();
  if (result.ok) {
    console.log(`✓ current_user_role() returns: ${result.role}`);
    if (result.applied) console.log("✓ Applied 006_auth_functions.sql");
  } else {
    console.error(`✗ current_user_role(): ${result.role ?? "null"}`);
    process.exit(1);
  }
}
