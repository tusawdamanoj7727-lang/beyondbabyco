#!/usr/bin/env node
/**
 * Audits the connected Supabase database against committed SQL migrations.
 * Uses PostgREST (service role) to probe tables/columns/functions.
 *
 * Usage: npm run audit:database
 * Optional: DATABASE_URL for pg_catalog checks (RLS helpers, internal functions).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

import { loadEnvFile } from "./env-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrationDir = join(root, "supabase/database");

/** Per-migration sentinel checks — proves migration applied. */
const MIGRATION_SENTINELS = [
  { file: "001_initial_schema.sql", table: "roles", column: "id" },
  { file: "002_indexes.sql", table: "products", column: "slug" },
  { file: "003_rls.sql", pgFunction: "is_admin" },
  { file: "004_storage.sql", table: "media_folders", column: "id" },
  { file: "005_seed.sql", table: "permissions", column: "code" },
  { file: "006_auth_functions.sql", rpc: "current_user_role" },
  { file: "007_products_admin.sql", table: "products", column: "sale_price" },
  { file: "008_categories_brands_admin.sql", table: "categories", column: "deleted_at" },
  { file: "009_media_library.sql", table: "media_library", column: "original_name" },
  { file: "010_homepage_cms.sql", table: "hero_slides", column: "description" },
  { file: "011_inventory_warehouse.sql", table: "warehouses", column: "is_default" },
  { file: "012_orders_fulfillment.sql", table: "orders", column: "internal_notes" },
  { file: "013_customers_crm.sql", table: "customers", column: "deleted_at" },
  { file: "014_reviews_moderation.sql", table: "reviews", column: "deleted_at" },
  { file: "015_returns_rma.sql", table: "returns", column: "id" },
  { file: "016_coupons_promotions.sql", table: "coupons", column: "deleted_at" },
  { file: "017_shipping_logistics.sql", table: "shipping_zones", column: "deleted_at" },
  { file: "018_payments_gateway.sql", table: "payment_gateways", column: "id" },
  { file: "019_reports_analytics.sql", table: "saved_reports", column: "id" },
  { file: "020_accounting_finance.sql", table: "journal_entries", column: "id" },
  { file: "021_marketing_automation.sql", table: "marketing_campaigns", column: "id" },
  { file: "022_admin_bootstrap.sql", permissionCode: "marketing.view" },
  { file: "023_delhivery_integration.sql", table: "shipment_tracking", column: "id" },
];

const CORE_TABLES = [
  "products", "categories", "brands", "product_variants", "customers", "profiles",
  "orders", "order_items", "payments", "shipments", "coupons", "wishlist", "cart",
  "cart_items", "customer_addresses", "media_library", "media_folders",
  "marketing_campaigns", "marketing_segments", "email_queue",
  "saved_reports", "analytics_snapshots", "homepage_settings", "homepage_sections",
  "hero_slides", "testimonials", "notifications", "audit_logs", "settings",
  "shipment_tracking", "customer_events", "payment_gateways", "payment_logs",
];

const CORE_FUNCTIONS = [
  "current_user_role",
  "current_user_permissions",
  "is_admin",
  "is_manager",
  "is_staff",
  "has_role",
  "log_audit",
  "log_activity",
  "set_updated_at",
];

const envPath = resolve(root, ".env.local");
if (!existsSync(envPath)) {
  console.error("✗ .env.local missing");
  process.exit(1);
}

const env = loadEnvFile(envPath, readFileSync, existsSync);
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const dbUrl = resolveDatabaseUrl(env);

if (!url || !serviceKey) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let pgClient = null;

async function getPg() {
  if (!dbUrl) return null;
  if (pgClient) return pgClient;
  const { default: pg } = await import("pg");
  pgClient = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await pgClient.connect();
  return pgClient;
}

function resolveDatabaseUrl(env) {
  for (const key of ["DATABASE_URL", "SUPABASE_DB_URL", "POSTGRES_URL"]) {
    const v = env[key]?.trim();
    if (v) return v;
  }
  const password = env.SUPABASE_DB_PASSWORD?.trim();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!password || !supabaseUrl) return null;
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

async function probeColumn(table, column) {
  const { error } = await supabase.from(table).select(column).limit(0);
  if (!error) return { ok: true };
  const msg = error.message ?? "";
  if (msg.includes("does not exist") || error.code === "42703" || error.code === "PGRST204") {
    return { ok: false, reason: msg };
  }
  if (msg.includes("Could not find the table") || error.code === "PGRST205") {
    return { ok: false, reason: `table missing: ${msg}` };
  }
  return { ok: true, warning: msg };
}

async function probePermissionCode(code) {
  const { data, error } = await supabase.from("permissions").select("code").eq("code", code).limit(1);
  if (error) return { ok: false, reason: error.message };
  return data?.length ? { ok: true } : { ok: false, reason: `permission ${code} missing` };
}

async function probeRpc(name) {
  const { error } = await supabase.rpc(name);
  if (!error) return { ok: true };
  const msg = error.message ?? "";
  if (msg.includes("Could not find the function") || error.code === "PGRST202") {
    return { ok: false, reason: msg };
  }
  return { ok: true, warning: msg };
}

async function probePgFunction(name) {
  const pg = await getPg();
  if (!pg) return { ok: null, reason: "DATABASE_URL required for pg_catalog check" };
  const { rows } = await pg.query(
    `select exists(
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = $1
    ) as exists`,
    [name],
  );
  return rows[0]?.exists ? { ok: true } : { ok: false, reason: `function ${name}() missing in pg_catalog` };
}

async function probePgFunctions(names) {
  const results = [];
  for (const fn of names) {
    const r = await probePgFunction(fn);
    results.push({ fn, ...r });
  }
  return results;
}

async function probeTable(table) {
  const { error } = await supabase.from(table).select("id").limit(0);
  if (!error) return { ok: true };
  const msg = error.message ?? "";
  if (msg.includes("Could not find the table") || error.code === "PGRST205") {
    return { ok: false, reason: msg };
  }
  return { ok: true, warning: msg };
}

console.log("\nBeyondBabyCo — Database Schema Audit\n");
console.log(`Project: ${url}`);
console.log(`Pg catalog: ${dbUrl ? "enabled" : "disabled (add DATABASE_URL)"}\n`);

const migrationFiles = readdirSync(migrationDir)
  .filter((f) => /^\d{3}_.+\.sql$/.test(f))
  .sort();

const migrationResults = [];
let lastApplied = null;
let firstMissing = null;

for (const sentinel of MIGRATION_SENTINELS) {
  let result;
  if (sentinel.rpc) {
    result = await probeRpc(sentinel.rpc);
  } else if (sentinel.permissionCode) {
    result = await probePermissionCode(sentinel.permissionCode);
  } else if (sentinel.pgFunction) {
    result = await probePgFunction(sentinel.pgFunction);
    if (result.ok === null) result = { ok: false, reason: result.reason, indeterminate: true };
  } else {
    result = await probeColumn(sentinel.table, sentinel.column);
  }
  const applied = result.ok === true;
  migrationResults.push({ ...sentinel, applied, ...result });
  if (applied) lastApplied = sentinel.file;
  else if (!firstMissing && result.ok === false && !result.indeterminate) firstMissing = sentinel.file;
}

console.log("── Migration status ──\n");
for (const m of migrationResults) {
  const icon = m.applied ? "✓" : m.indeterminate ? "?" : "✗";
  const detail = m.applied ? (m.warning ? ` (warn: ${m.warning})` : "") : ` — ${m.reason ?? "missing"}`;
  console.log(`${icon} ${m.file}${detail}`);
}

const missingMigrations = migrationResults.filter((m) => m.applied === false && !m.indeterminate).map((m) => m.file);
const appliedMigrations = migrationResults.filter((m) => m.applied).map((m) => m.file);

console.log("\n── Core tables ──\n");
const tableResults = [];
for (const table of CORE_TABLES) {
  const r = await probeTable(table);
  tableResults.push({ table, ...r });
  console.log(`${r.ok ? "✓" : "✗"} ${table}${r.ok ? "" : ` — ${r.reason}`}`);
}

console.log("\n── Core functions ──\n");
let functionResults = [];
if (dbUrl) {
  functionResults = await probePgFunctions(CORE_FUNCTIONS);
  for (const f of functionResults) {
    console.log(`${f.ok ? "✓" : "✗"} ${f.fn}()${f.ok ? "" : ` — ${f.reason}`}`);
  }
} else {
  for (const fn of CORE_FUNCTIONS) {
    const r = await probeRpc(fn);
    functionResults.push({ fn, viaRpc: true, ...r });
    const note = r.ok ? "" : " — not REST-exposed (use DATABASE_URL for pg check)";
    console.log(`${r.ok ? "✓" : "?"} ${fn}()${note}`);
  }
}

if (pgClient) await pgClient.end().catch(() => {});

const report = {
  generatedAt: new Date().toISOString(),
  projectUrl: url,
  pgCatalogEnabled: Boolean(dbUrl),
  migrationFilesOnDisk: migrationFiles.length,
  appliedMigrations,
  missingMigrations,
  lastAppliedMigration: lastApplied,
  firstMissingMigration: firstMissing,
  missingTables: tableResults.filter((t) => !t.ok).map((t) => t.table),
  missingFunctions: functionResults.filter((f) => f.ok === false).map((f) => f.fn),
  migrationDetails: migrationResults,
};

const outPath = join(root, "scripts/.database-audit.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`\n── Summary ──\n`);
console.log(`Applied:  ${appliedMigrations.length}/${migrationResults.length} migrations`);
console.log(`Missing:  ${missingMigrations.length} migrations`);
if (firstMissing) console.log(`First gap: ${firstMissing}`);
console.log(`Missing tables: ${report.missingTables.length}`);
console.log(`Missing functions: ${report.missingFunctions.length}`);
console.log(`\nReport: ${outPath}`);
if (missingMigrations.length > 0) {
  console.log(`\nRepair: npm run sync:database -- --missing-only\n`);
}

process.exit(missingMigrations.length > 0 ? 1 : 0);
