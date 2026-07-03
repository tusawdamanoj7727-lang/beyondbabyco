/** Shared migration metadata for audit / sync / repair. */
import { readdirSync } from "node:fs";
import { join } from "node:path";

export const MIGRATION_DIR_NAME = "supabase/database";

/** Per-migration sentinel — proves migration applied (REST or pg). */
export const MIGRATION_SENTINELS = [
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

export const REPAIR_MIGRATION_RANGE = { from: 7, to: 21 };

export function listMigrationFiles(migrationDir) {
  return readdirSync(migrationDir)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort();
}

export function migrationNumber(filename) {
  return parseInt(filename.slice(0, 3), 10);
}

export function migrationsInRange(files, from, to) {
  return files.filter((f) => {
    const n = migrationNumber(f);
    return n >= from && n <= to;
  });
}

export function resolveDatabaseUrl(env) {
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

/** SQLSTATE codes that are safe to continue past (idempotent re-run). */
export const CONTINUABLE_SQL_STATES = new Set([
  "42710", // duplicate_object
  "42P07", // duplicate_table
  "42701", // duplicate_column
  "23505", // unique_violation (seed already present)
  "42P06", // duplicate_schema
  "42723", // duplicate_function
  "42704", // undefined_object (drop if not exists follow-on)
]);
