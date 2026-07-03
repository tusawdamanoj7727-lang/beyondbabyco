#!/usr/bin/env node
/**
 * Validates local admin prerequisites: env vars, Supabase connectivity, bootstrap user.
 * Auto-runs bootstrap when the admin auth user is missing.
 * Run: npm run check:admin
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

import { ADMIN_EMAIL, bootstrapAdmin } from "./bootstrap-admin.mjs";
import { ensureAuthRpcs } from "./ensure-auth-rpcs.mjs";
import { auditSupabaseEnv, loadEnvFile } from "./env-config.mjs";
import { getAppUrlFromEnv } from "./lib/app-url.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

function info(msg) {
  console.log(`  ${msg}`);
}

console.log("\nBeyondBabyCo — Admin setup check\n");

if (!existsSync(envPath)) {
  fail(".env.local is missing");
  info("Create it from the template:");
  info("  cp .env.example .env.local");
  info("Then paste your Supabase values from:");
  info("  Supabase Dashboard → Project Settings → API");
  process.exit(1);
}

ok("Environment OK (.env.local exists)");

const env = loadEnvFile(envPath, readFileSync, existsSync);
const { missing, configured } = auditSupabaseEnv(env);

for (const key of configured) {
  ok(`${key} configured`);
}

const requiredMissing = missing.filter((m) => m.required);

if (requiredMissing.length > 0) {
  console.error("\n✗ Missing required environment variables:");
  for (const { key } of requiredMissing) {
    console.error(`    • ${key}`);
  }
  info("Paste each value into .env.local from Supabase Dashboard → Project Settings → API");
  process.exit(1);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const anon = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error: healthError } = await anon.from("roles").select("id").limit(1);
if (healthError) {
  fail(`Database not ready: ${healthError.message}`);
  info("Apply migrations via Supabase SQL Editor:");
  info("  npm run db:combine  →  paste supabase/database/APPLY_ALL.sql");
  process.exit(1);
}
ok("Database OK (roles table reachable)");

if (!serviceKey) {
  fail("SUPABASE_SERVICE_ROLE_KEY required for auth user verification");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verifyBootstrapUser() {
  const { data: listData, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    fail(`auth.users check failed: ${listError.message}`);
    return null;
  }

  let user = listData.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (!user) {
    info("No admin user in auth.users — running bootstrap...");
    try {
      await bootstrapAdmin({ silent: true });
    } catch (err) {
      fail(`Bootstrap failed: ${err instanceof Error ? err.message : String(err)}`);
      info("Run manually: npm run bootstrap:admin");
      return null;
    }

    const { data: retryData, error: retryError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (retryError) {
      fail(`auth.users recheck failed: ${retryError.message}`);
      return null;
    }
    user = retryData.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (!user) {
      fail(`Bootstrap admin still missing in auth.users (${ADMIN_EMAIL})`);
      info("Run manually: npm run bootstrap:admin");
      return null;
    }
    ok(`auth.users (${ADMIN_EMAIL}) — created via bootstrap`);
  } else {
    ok(`auth.users (${ADMIN_EMAIL})`);
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, is_active, role_id, roles(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    fail(`profiles check failed: ${profileError.message}`);
    return user;
  }

  if (!profile) {
    fail("profiles — row missing for bootstrap admin");
    info("Run: npm run bootstrap:admin");
    return user;
  }

  if (!profile.is_active) {
    fail("profiles — bootstrap admin is inactive");
    info("Run: npm run bootstrap:admin");
    return user;
  }

  if (!profile.roles?.name) {
    fail("profiles — no role assigned");
    info("Run: npm run bootstrap:admin");
    return user;
  }

  ok(`profiles (role: ${profile.roles.name})`);

  const { data: adminRole, error: roleError } = await admin
    .from("roles")
    .select("id")
    .eq("name", "admin")
    .maybeSingle();

  if (roleError) {
    fail(`admin role check failed: ${roleError.message}`);
    return user;
  }

  if (!adminRole) {
    fail("admin role — not found");
    info("Run: npm run bootstrap:admin");
    return user;
  }

  if (profile.role_id !== adminRole.id) {
    fail("admin role — profile is not linked to the admin role");
    info("Run: npm run bootstrap:admin");
    return user;
  }

  ok("admin role");

  const { count: permCount, error: permError } = await admin
    .from("permissions")
    .select("*", { count: "exact", head: true });

  if (permError) {
    fail(`permissions check failed: ${permError.message}`);
    return user;
  }

  if ((permCount ?? 0) === 0) {
    fail("permissions — none seeded");
    info("Run: npm run bootstrap:admin");
    return user;
  }

  const { count: mappingCount, error: mappingError } = await admin
    .from("role_permissions")
    .select("*", { count: "exact", head: true })
    .eq("role_id", adminRole.id);

  if (mappingError) {
    fail(`role_permissions check failed: ${mappingError.message}`);
    return user;
  }

  if ((mappingCount ?? 0) === 0) {
    fail("permissions — admin role has no permission mappings");
    info("Run: npm run bootstrap:admin");
    return user;
  }

  ok(`permissions (${mappingCount} admin mappings, ${permCount} total)`);

  const rpc = await ensureAuthRpcs({ silent: true });
  if (!rpc.ok) {
    info("current_user_role() missing or broken — attempting repair...");
    const repaired = await ensureAuthRpcs({ silent: false });
    if (!repaired.ok) {
      fail(`current_user_role() returns: ${repaired.role ?? "null"} (expected "admin")`);
      return user;
    }
    ok(`current_user_role() returns: ${repaired.role}`);
  } else {
    ok(`current_user_role() returns: ${rpc.role}`);
  }

  return user;
}

await verifyBootstrapUser();

console.log("\n--- Local admin URLs ---");
let appUrl;
try {
  appUrl = getAppUrlFromEnv(env);
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
info(`Login:     ${appUrl}/admin/login`);
info(`Dashboard: ${appUrl}/admin`);
info(`Email:     ${ADMIN_EMAIL}`);
info("Password:  Admin@123456  (change after first login)");

console.log("\n--- Next steps ---");
info("1. npm run dev");
info("2. Open /admin/login");
info("3. Sign in with the credentials above\n");

if (process.exitCode) {
  process.exit(1);
}

console.log("Admin environment looks ready for manual testing.\n");
