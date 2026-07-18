#!/usr/bin/env node
/**
 * Validates SQL migration files for ordering and basic safety patterns.
 * Usage: npm run validate:migrations
 */
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATION_DIR = join(__dirname, "../supabase/database");

const files = readdirSync(MIGRATION_DIR)
  .filter((f) => /^\d{3}_.+\.sql$/.test(f))
  .sort();

if (files.length === 0) {
  console.error("No migration files found");
  process.exit(1);
}

let errors = 0;

for (let i = 0; i < files.length; i++) {
  const num = parseInt(files[i].slice(0, 3), 10);
  if (i > 0) {
    const prev = parseInt(files[i - 1].slice(0, 3), 10);
    // Historical repo has a few same-number siblings; warn but do not block deploy.
    if (num < prev) {
      console.error(`Order error: ${files[i]} must be after ${files[i - 1]}`);
      errors++;
    } else if (num === prev) {
      console.warn(`Warning: duplicate migration prefix ${files[i]} and ${files[i - 1]}`);
    }
  }

  const content = readFileSync(join(MIGRATION_DIR, files[i]), "utf-8");
  if (!/create table if not exists|alter table|insert into|on conflict/i.test(content)) {
    console.warn(`Warning: ${files[i]} may lack idempotent guards`);
  }
}

console.log(`Validated ${files.length} migrations`);
process.exit(errors > 0 ? 1 : 0);
