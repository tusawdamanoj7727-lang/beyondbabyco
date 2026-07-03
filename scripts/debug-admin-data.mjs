#!/usr/bin/env node
/**
 * Print admin bootstrap data + test current_user_role() as admin@beyondbabyco.com
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

import { loadEnvFile } from "./env-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ADMIN_EMAIL = "admin@beyondbabyco.com";

const envPath = resolve(root, ".env.local");
if (!existsSync(envPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const env = loadEnvFile(envPath, readFileSync, existsSync);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("=== select id, email from auth.users ===");
const { data: users, error: uErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (uErr) console.log("ERROR:", uErr.message);
else for (const u of users.users) console.log(u.id, u.email);

console.log("\n=== select id, role_id, full_name from profiles ===");
const { data: profiles, error: pErr } = await admin.from("profiles").select("id, role_id, full_name");
if (pErr) console.log("ERROR:", pErr.message);
else for (const p of profiles ?? []) console.log(JSON.stringify(p));

console.log("\n=== select id, name from roles ===");
const { data: roles, error: rErr } = await admin.from("roles").select("id, name");
if (rErr) console.log("ERROR:", rErr.message);
else for (const r of roles ?? []) console.log(JSON.stringify(r));

console.log("\n=== select p.id, r.name from profiles p join roles r on p.role_id = r.id ===");
const { data: joined, error: jErr } = await admin.from("profiles").select("id, roles(name)");
if (jErr) console.log("ERROR:", jErr.message);
else for (const row of joined ?? []) console.log(row.id, row.roles?.name);

console.log("\n=== current_user_role() definition (from 006_auth_functions.sql) ===");
const sqlPath = resolve(root, "supabase/database/006_auth_functions.sql");
console.log(readFileSync(sqlPath, "utf8").split("$$")[1]?.trim() ?? "(see 006_auth_functions.sql)");

console.log("\n=== signInAction RPC: supabase.rpc('current_user_role') ===");
const anon = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({
  email: ADMIN_EMAIL,
  password: "Admin@123456",
});
if (signErr) {
  console.log("signIn ERROR:", signErr.message);
  process.exit(1);
}

const authed = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${signIn.session.access_token}` } },
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: roleName, error: rpcErr } = await authed.rpc("current_user_role");
console.log("signed-in user:", signIn.user.id);
console.log("current_user_role():", roleName ?? null);
if (rpcErr) console.log("rpc ERROR:", rpcErr.message);

if (roleName !== "admin") process.exit(1);
