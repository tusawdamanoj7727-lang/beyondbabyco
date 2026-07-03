#!/usr/bin/env node
/**
 * Applies committed SQL migrations statement-by-statement with conflict checks.
 *
 * Usage:
 *   npm run sync:database -- --missing-only
 *   npm run sync:database -- --from=007
 *   npm run sync:database -- --dry-run
 *
 * Writes scripts/.database-sync-report.json
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CONTINUABLE_SQL_STATES,
  listMigrationFiles,
  migrationNumber,
  resolveDatabaseUrl,
} from "./lib/database-migrations.mjs";
import {
  hasOnConflict,
  parseInsertTable,
  parseOnConflict,
  splitSqlStatements,
  truncateStatement,
  verifyConflictConstraint,
} from "./lib/migration-sql.mjs";
import { loadEnvFile } from "./env-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrationDir = join(root, "supabase/database");
const auditPath = join(root, "scripts/.database-audit.json");
const reportPath = join(root, "scripts/.database-sync-report.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const missingOnly = args.includes("--missing-only");
const fromArg = args.find((a) => a.startsWith("--from="));
const fromNum = fromArg ? parseInt(fromArg.split("=")[1], 10) : null;

const envPath = resolve(root, ".env.local");
if (!existsSync(envPath)) {
  console.error("✗ .env.local missing");
  process.exit(1);
}

const env = loadEnvFile(envPath, readFileSync, existsSync);
const dbUrl = resolveDatabaseUrl(env);

if (!dbUrl) {
  console.error("✗ DATABASE_URL or SUPABASE_DB_PASSWORD missing from .env.local");
  process.exit(1);
}

const allFiles = listMigrationFiles(migrationDir);
let toApply = allFiles;

if (missingOnly) {
  if (!existsSync(auditPath)) {
    console.error("✗ Run npm run audit:database first");
    process.exit(1);
  }
  const audit = JSON.parse(readFileSync(auditPath, "utf8"));
  const missing = new Set(audit.missingMigrations ?? []);
  toApply = allFiles.filter((f) => missing.has(f));
} else if (fromNum) {
  toApply = allFiles.filter((f) => migrationNumber(f) >= fromNum);
}

const report = {
  generatedAt: new Date().toISOString(),
  dryRun,
  migrations: [],
  skippedStatements: [],
  errors: [],
  conflictWarnings: [],
};

console.log("\nBeyondBabyCo — Database Sync\n");
console.log(`Migrations: ${toApply.length}\n`);

if (dryRun) {
  for (const f of toApply) console.log(`  • ${f}`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  process.exit(0);
}

const { default: pg } = await import("pg");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("✓ Connected\n");

  for (const file of toApply) {
    const sql = readFileSync(join(migrationDir, file), "utf8");
    const statements = splitSqlStatements(sql);
    const migrationResult = {
      migration: file,
      status: "pending",
      statementsTotal: statements.length,
      statementsApplied: 0,
      statementsSkipped: 0,
      statementErrors: [],
    };

    console.log(`── ${file} (${statements.length} statements)`);

    for (const statement of statements) {
      const preview = truncateStatement(statement);

      if (hasOnConflict(statement)) {
        const table = parseInsertTable(statement);
        const conflict = parseOnConflict(statement);
        if (table && conflict) {
          const check = await verifyConflictConstraint(client, table, conflict);
          if (!check.ok) {
            const entry = {
              migration: file,
              sqlState: "42P10",
              statement: preview,
              reason: check.reason ?? "Missing unique constraint",
              table,
              columns: conflict.columns,
              expectedConstraint: check.expected,
              action: "skipped",
            };
            report.conflictWarnings.push(entry);
            report.skippedStatements.push(entry);
            migrationResult.statementsSkipped++;
            console.log(`  ⊘ skip ON CONFLICT — ${table}(${conflict.columns?.join(", ") ?? "PK"}): ${check.reason ?? check.expected}`);
            continue;
          }
        }
      }

      try {
        await client.query(statement);
        migrationResult.statementsApplied++;
      } catch (err) {
        const sqlState = err.code ?? "UNKNOWN";
        const message = err instanceof Error ? err.message : String(err);
        const entry = {
          migration: file,
          sqlState,
          statement: preview,
          message,
          reason: message,
        };

        if (CONTINUABLE_SQL_STATES.has(sqlState)) {
          entry.action = "continued";
          migrationResult.statementsSkipped++;
          report.skippedStatements.push(entry);
          console.log(`  ⚠ ${sqlState} (continued): ${message.slice(0, 80)}`);
          continue;
        }

        if (sqlState === "42P10") {
          entry.action = "skipped";
          migrationResult.statementsSkipped++;
          report.skippedStatements.push(entry);
          report.conflictWarnings.push(entry);
          console.log(`  ⊘ 42P10 skipped: ${preview.slice(0, 60)}…`);
          continue;
        }

        entry.action = "failed";
        migrationResult.statementErrors.push(entry);
        report.errors.push(entry);
        migrationResult.status = "failed";
        console.log(`  ✗ ${sqlState}: ${message}`);
        break;
      }
    }

    if (migrationResult.status !== "failed") {
      migrationResult.status = migrationResult.statementErrors.length ? "partial" : "applied";
      try {
        await client.query("NOTIFY pgrst, 'reload schema'");
      } catch {
        /* ignore */
      }
      console.log(`  ✓ ${migrationResult.status} (${migrationResult.statementsApplied}/${migrationResult.statementsTotal})\n`);
    } else {
      console.log(`  ✗ migration halted\n`);
    }

    report.migrations.push(migrationResult);
    if (migrationResult.status === "failed") break;
  }
} catch (err) {
  console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}

writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`Report: ${reportPath}`);

const failed = report.migrations.filter((m) => m.status === "failed");
process.exit(failed.length > 0 ? 1 : 0);
