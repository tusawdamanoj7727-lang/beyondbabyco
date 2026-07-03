#!/usr/bin/env node
/**
 * Validates auth redirect configuration for Supabase (Site URL + allowlist).
 * Fails when NEXT_PUBLIC_APP_URL port differs from the active local dev server.
 * Run: npm run check:auth
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { auditSupabaseEnv, loadEnvFile } from "./env-config.mjs";
import {
  detectActiveDevServerPort,
  formatLocalAppUrl,
  getAppUrlFromEnv,
  getAppUrlPort,
  isLocalhostAppUrl,
} from "./lib/app-url.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function ok(msg) {
  console.log(`✓ ${msg}`);
}

function warn(msg) {
  console.warn(`⚠ ${msg}`);
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
}

console.log("\nBeyondBabyCo — Auth configuration check\n");

if (!existsSync(envPath)) {
  fail(".env.local is missing — copy from .env.example");
  process.exit(1);
}

const env = loadEnvFile(envPath, readFileSync, existsSync);
const { missing, configured } = auditSupabaseEnv(env);

for (const key of configured) ok(`${key} configured`);
for (const key of missing) fail(`${key} missing`);

let appUrl;
try {
  appUrl = getAppUrlFromEnv(env);
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

const callbackUrl = `${appUrl}/auth/callback`;
const configuredPort = getAppUrlPort(appUrl);

ok(`Auth base URL: ${appUrl}`);
ok(`Callback URL:  ${callbackUrl}`);

if (isLocalhostAppUrl(appUrl)) {
  const activePort = await detectActiveDevServerPort();
  if (activePort === null) {
    warn(
      "No local dev server detected — start npm run dev, then re-run check:auth to verify the port matches NEXT_PUBLIC_APP_URL",
    );
  } else if (activePort !== configuredPort) {
    fail(
      `APP_URL port mismatch: NEXT_PUBLIC_APP_URL uses port ${configuredPort} but dev server is on port ${activePort}. ` +
        `Update .env.local:\n  NEXT_PUBLIC_APP_URL=${formatLocalAppUrl(activePort)}`,
    );
  } else {
    ok(`Dev server port ${activePort} matches NEXT_PUBLIC_APP_URL`);
  }
}

console.log("\n--- Add these in Supabase Dashboard → Authentication → URL Configuration ---");
console.log(`Site URL:        ${appUrl}`);
console.log("Redirect URLs (one per line):");
console.log(`  ${appUrl}/auth/callback`);
console.log(`  ${appUrl}/auth/callback?*`);
console.log(`  ${callbackUrl}?type=signup&next=/account?verified=1`);
console.log(`  ${callbackUrl}?type=recovery&next=/reset-password`);

console.log("\n--- OAuth providers (Authentication → Providers) ---");
console.log("  Enable Google OAuth in Supabase Dashboard → Authentication → Providers");
console.log(`  Provider redirect URI (Supabase): ${env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "")}/auth/v1/callback`);

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  warn("SUPABASE_SERVICE_ROLE_KEY missing — profile bootstrap after signup/OAuth will be skipped");
}

console.log("\nAuth configuration check complete.\n");

if (process.exitCode) {
  process.exit(1);
}
