#!/usr/bin/env node
/**
 * Regenerate src/lib/supabase/database.types.ts from the live Postgres schema.
 * Reads DATABASE_URL from .env.local (never logged).
 *
 * Prefers @supabase/postgres-meta (pure Node + pg, no Docker). Falls back to
 * Supabase CLI --db-url when Docker/Podman is available.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "./env-config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = loadEnvFile(join(root, ".env.local"), readFileSync, existsSync);
const dbUrl = env?.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const outPath = join(root, "src/lib/supabase/database.types.ts");
const cacheDir = join(root, "node_modules/.cache/postgres-meta");
const metaDir = process.env.PG_META_REPO ?? cacheDir;

function ensurePostgresMeta() {
  if (existsSync(join(metaDir, "package.json"))) return;
  mkdirSync(dirname(metaDir), { recursive: true });
  console.log("Cloning supabase/postgres-meta (one-time)…");
  execFileSync(
    "git",
    ["clone", "--depth", "1", "https://github.com/supabase/postgres-meta.git", metaDir],
    { stdio: "inherit" },
  );
  console.log("Installing postgres-meta dependencies…");
  execFileSync("npm", ["ci"], { cwd: metaDir, stdio: "inherit" });
}

function stripNpmNoise(text) {
  return text
    .replace(/^> @supabase\/postgres-meta[^\n]*\n/gm, "")
    .replace(/^> PG_META_GENERATE_TYPES[^\n]*\n/gm, "")
    .trimStart();
}

function appendAliases(text) {
  if (text.includes("export type ProductStatus")) return text;
  return `${text.trimEnd()}

/** App-level aliases for Postgres enums (kept for stable imports). */
export type ProductStatus = Database["public"]["Enums"]["product_status"]
export type OrderStatus = Database["public"]["Enums"]["order_status"]
export type PaymentStatus = Database["public"]["Enums"]["payment_status"]
export type ShipmentStatus = Database["public"]["Enums"]["shipment_status"]
export type MovementType = Database["public"]["Enums"]["movement_type"]

/** Catalog taxonomy status (check constraint, not a Postgres enum). */
export type CatalogStatus = "draft" | "active" | "archived"

/** Purchase order workflow (check constraint, not a Postgres enum). */
export type PoStatus = "draft" | "sent" | "received" | "cancelled"
`;
}

function generateViaPostgresMeta() {
  ensurePostgresMeta();
  const raw = execFileSync("npm", ["run", "gen:types:typescript"], {
    cwd: metaDir,
    encoding: "utf8",
    maxBuffer: 30 * 1024 * 1024,
    env: {
      ...process.env,
      PG_META_DB_URL: dbUrl,
      PG_META_GENERATE_TYPES: "typescript",
      PG_META_GENERATE_TYPES_INCLUDED_SCHEMAS: "public",
      PG_META_GENERATE_TYPES_DETECT_ONE_TO_ONE_RELATIONSHIPS: "true",
    },
  });
  return stripNpmNoise(raw);
}

function directDbUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes(".pooler.supabase.com")) {
      const ref = parsed.username.replace(/^postgres\./, "") || parsed.hostname.split(".")[0];
      parsed.username = "postgres";
      parsed.hostname = `db.${ref}.supabase.co`;
      parsed.port = "5432";
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function generateViaSupabaseCli() {
  const urls = [...new Set([directDbUrl(dbUrl), dbUrl])];
  let lastErr = "";
  for (const url of urls) {
    try {
      const out = execFileSync(
        "npx",
        ["supabase", "gen", "types", "typescript", "--db-url", url, "--schema", "public"],
        { encoding: "utf8", maxBuffer: 30 * 1024 * 1024, cwd: root },
      );
      if (out.trim().length > 100) return out;
      lastErr = "CLI output too short.";
    } catch (err) {
      lastErr = [err.stderr?.toString?.(), err.stdout?.toString?.()].filter(Boolean).join("\n");
    }
  }
  throw new Error(lastErr || "Supabase CLI type generation failed.");
}

const header = `/**
 * Supabase database types — auto-generated from the live Postgres schema.
 *
 * Regenerate: npm run db:types
 */
`;

let generated;
try {
  generated = generateViaPostgresMeta();
  console.log("Generated via @supabase/postgres-meta");
} catch (metaErr) {
  console.warn("postgres-meta failed, trying Supabase CLI:", metaErr.message);
  try {
    generated = generateViaSupabaseCli();
    console.log("Generated via Supabase CLI");
  } catch (cliErr) {
    console.error("Type generation failed.\n", cliErr.message);
    console.error("\nAlternatives:");
    console.error("  1. npx supabase login && npx supabase link --project-ref dawywibxularpygspogp");
    console.error("  2. npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts");
    console.error("  3. Supabase Dashboard → Settings → API → Generate TypeScript types");
    process.exit(1);
  }
}

writeFileSync(outPath, header + appendAliases(stripNpmNoise(generated)), "utf8");
console.log(`Wrote ${outPath} (${generated.split("\n").length} lines)`);
