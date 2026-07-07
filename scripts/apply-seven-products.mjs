#!/usr/bin/env node
/**
 * Apply 040_exactly_seven_products.sql and print before/after product lists.
 * Usage: node scripts/apply-seven-products.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {
    /* optional */
  }
}

const CANONICAL_SLUGS = [
  "baby-hair-oil-100ml",
  "baby-massage-oil-100ml",
  "baby-body-wash-200ml",
  "baby-lotion-200ml",
  "baby-diaper-rash-cream-50gm",
  "baby-shampoo-200ml",
  "tummy-rollon-40ml",
];

async function listProducts(client, label) {
  const { rows } = await client.query(`
    select id, name, slug, status, stock, price
    from public.products
    where deleted_at is null
    order by name
  `);
  console.log(`\n=== ${label} (${rows.length} products) ===`);
  console.table(rows);
  return rows;
}

async function listActive(client) {
  const { rows } = await client.query(`
    select name, slug, price, status, stock
    from public.products
    where deleted_at is null and status = 'active'
    order by slug
  `);
  console.log(`\n=== ACTIVE products (${rows.length} rows — expect 7) ===`);
  console.table(rows);
  return rows;
}

async function main() {
  loadEnv();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL missing from .env.local");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await listProducts(client, "STEP 1 — All products (before)");

    const sql = readFileSync(
      join(ROOT, "supabase/database/040_exactly_seven_products.sql"),
      "utf8",
    );
    await client.query(sql);

    const active = await listActive(client, "STEP 6 — Verify");

    const missing = CANONICAL_SLUGS.filter((s) => !active.some((r) => r.slug === s));
    if (active.length !== 7) {
      console.error(`\nExpected 7 active products, got ${active.length}.`);
      if (missing.length) console.error("Missing slugs:", missing.join(", "));
      process.exit(1);
    }

    console.log("\nSuccess: exactly 7 products are active on the storefront.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
