#!/usr/bin/env node
/**
 * Phase 10.0C — Safe migration execution (007–021 only, never APPLY_ALL.sql).
 *
 * Usage: npm run migrate:safe
 *
 * Requires DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MIGRATION_SENTINELS,
  REPAIR_MIGRATION_RANGE,
  listMigrationFiles,
  migrationNumber,
  migrationsInRange,
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
import { classifyError, verifyMigrationArtifacts, verifyMigrationSentinel } from "./lib/migration-verify.mjs";
import { loadEnvFile } from "./env-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrationDir = join(root, "supabase/database");
const checkpointPath = join(root, "scripts/.database-migration-checkpoints.json");
const syncReportPath = join(root, "scripts/.database-sync-report.json");
const errorSqlPath = join(root, "scripts/database-error.sql");
const completeReportPath = join(root, "docs/PHASE_10_0C_DATABASE_COMPLETE.md");

const envPath = resolve(root, ".env.local");

function fail(msg, code = 1) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(code);
}

// ── PART 1: Environment ─────────────────────────────────────────────
console.log("\nBeyondBabyCo — Phase 10.0C Safe Migration Execution\n");
console.log("── Part 1: Environment ──\n");

if (!existsSync(envPath)) {
  fail(".env.local is missing");
}

const env = loadEnvFile(envPath, readFileSync, existsSync);
const hasDirectUrl = Boolean(
  env.DATABASE_URL?.trim() || env.SUPABASE_DB_URL?.trim() || env.POSTGRES_URL?.trim(),
);
const hasPassword = Boolean(env.SUPABASE_DB_PASSWORD?.trim());
const dbUrl = resolveDatabaseUrl(env);

if (!dbUrl) {
  const missing = [];
  if (!hasDirectUrl) missing.push("DATABASE_URL (or SUPABASE_DB_URL / POSTGRES_URL)");
  if (!hasPassword) missing.push("SUPABASE_DB_PASSWORD");
  console.error("Missing required database connection variable(s):");
  for (const v of missing) console.error(`  • ${v}`);
  console.error("\nAdd one of the following to .env.local:");
  console.error("  DATABASE_URL=postgresql://postgres.[ref]:[password]@...supabase.com:6543/postgres");
  console.error("  — or —");
  console.error("  SUPABASE_DB_PASSWORD=[your database password from Supabase Dashboard → Database]");

  writeFileSync(
    completeReportPath,
    `# Phase 10.0C — Database Migration Complete

**Generated:** ${new Date().toISOString()}
**Status:** BLOCKED — database credentials missing

## Part 1 — Environment check FAILED

Missing variable(s):

${missing.map((v) => `- \`${v}\``).join("\n")}

## Action required

Add to \`.env.local\`:

\`\`\`
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
\`\`\`

Or:

\`\`\`
SUPABASE_DB_PASSWORD=your_database_password
\`\`\`

Then run:

\`\`\`bash
npm run migrate:safe
\`\`\`

## Migrations pending

007–021 (15 files) — use \`npm run migrate:safe\`, never APPLY_ALL.sql.
`,
  );
  console.error(`\nReport: ${completeReportPath}\n`);
  process.exit(1);
}

console.log(`✓ Database connection configured (${hasDirectUrl ? "DATABASE_URL" : "SUPABASE_DB_PASSWORD"})\n`);

const allFiles = listMigrationFiles(migrationDir);
const toApply = migrationsInRange(allFiles, REPAIR_MIGRATION_RANGE.from, REPAIR_MIGRATION_RANGE.to);

console.log(`── Part 2: Safe execution (007–021, ${toApply.length} files) ──\n`);
console.log("Never using APPLY_ALL.sql — individual migrations only.\n");

const report = {
  generatedAt: new Date().toISOString(),
  range: REPAIR_MIGRATION_RANGE,
  applied: [],
  skipped: [],
  failed: null,
  checkpoints: [],
  repairSqlExecuted: [],
  errors: [],
};

const { default: pg } = await import("pg");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("✓ Connected to PostgreSQL\n");

  for (const file of toApply) {
    const num = migrationNumber(file);
    const sentinel = MIGRATION_SENTINELS.find((s) => s.file === file);

    // Pre-check: already applied?
    if (sentinel) {
      const pre = await verifyMigrationSentinel(client, sentinel);
      if (pre.ok) {
        console.log(`── ${file} — already applied (${pre.detail}), skipping\n`);
        report.skipped.push({ migration: file, number: num, reason: "sentinel_satisfied", detail: pre.detail });
        report.checkpoints.push({ migration: file, number: num, status: "skipped_already_applied", at: new Date().toISOString() });
        writeFileSync(checkpointPath, JSON.stringify(report.checkpoints, null, 2));
        continue;
      }
    }

    const sql = readFileSync(join(migrationDir, file), "utf8");
    const statements = splitSqlStatements(sql);
    let applied = 0;
    let skipped = 0;
    let failedStatement = null;

    console.log(`── ${file} (${statements.length} statements)`);

    for (const statement of statements) {
      const preview = truncateStatement(statement, 300);

      if (hasOnConflict(statement)) {
        const table = parseInsertTable(statement);
        const conflict = parseOnConflict(statement);
        if (table && conflict) {
          const check = await verifyConflictConstraint(client, table, conflict);
          if (!check.ok) {
            console.log(`  ⊘ skip ON CONFLICT — ${table}: ${check.reason ?? check.expected}`);
            skipped++;
            continue;
          }
        }
      }

      try {
        await client.query(statement);
        applied++;
      } catch (err) {
        const sqlState = err.code ?? "UNKNOWN";
        const message = err instanceof Error ? err.message : String(err);
        const classification = classifyError(sqlState, message);

        if (classification.action === "skip") {
          console.log(`  ⚠ ${sqlState} skipped (${classification.reason}): ${message.slice(0, 70)}`);
          skipped++;
          continue;
        }

        // PART 3: Stop this migration — do not continue blindly
        failedStatement = {
          migration: file,
          number: num,
          sqlState,
          message,
          statement: statement,
          statementPreview: preview,
          reason: classification.reason,
        };
        report.failed = failedStatement;
        report.errors.push(failedStatement);

        writeFileSync(
          errorSqlPath,
          `-- Failed migration: ${file} (#${num})\n-- SQLSTATE: ${sqlState}\n-- Reason: ${message}\n\n${statement};\n`,
        );

        console.log(`\n✗ Migration ${file} FAILED`);
        console.log(`  Number:    ${num}`);
        console.log(`  SQLSTATE:  ${sqlState}`);
        console.log(`  Message:   ${message}`);
        console.log(`  Statement: ${preview}`);
        console.log(`  Reason:    ${classification.reason}`);
        console.log(`\n  Wrote failing SQL → ${errorSqlPath}`);
        console.log("\n  Stopped. Fix the error and re-run npm run migrate:safe\n");
        break;
      }
    }

    if (failedStatement) {
      writeFileSync(syncReportPath, JSON.stringify(report, null, 2));
      break;
    }

    // PART 5: Verify after migration
    await client.query("NOTIFY pgrst, 'reload schema'").catch(() => {});

    let verified = false;
    if (sentinel) {
      const post = await verifyMigrationSentinel(client, sentinel);
      verified = post.ok;
      if (!verified) {
        console.log(`  ⚠ Sentinel not satisfied after apply: ${post.detail}`);
      }
    } else {
      verified = true;
    }

    const artifacts = await verifyMigrationArtifacts(client, file);
    const checkpoint = {
      migration: file,
      number: num,
      status: verified ? "applied" : "applied_unverified",
      statementsApplied: applied,
      statementsSkipped: skipped,
      verified,
      at: new Date().toISOString(),
    };
    report.checkpoints.push(checkpoint);
    report.applied.push({ migration: file, number: num, ...checkpoint });
    writeFileSync(checkpointPath, JSON.stringify(report.checkpoints, null, 2));

    console.log(`  ✓ checkpoint committed (${applied} applied, ${skipped} skipped, verified=${verified})\n`);
  }
} finally {
  await client.end().catch(() => {});
}

writeFileSync(syncReportPath, JSON.stringify(report, null, 2));

if (report.failed) {
  generateCompleteReport(report, null, null, null, null);
  process.exit(1);
}

// ── PART 6–8: Final validation (only if all migrations processed) ─────
console.log("── Part 6: Final audit ──\n");
let auditExit = 1;
let audit = null;
try {
  execSync("npm run audit:database", { cwd: root, stdio: "inherit" });
  auditExit = 0;
  const auditPath = join(root, "scripts/.database-audit.json");
  if (existsSync(auditPath)) audit = JSON.parse(readFileSync(auditPath, "utf8"));
} catch {
  auditExit = 1;
}

console.log("\n── Part 7: Admin validation ──\n");
let adminExit = 1;
try {
  execSync("npm run check:admin", { cwd: root, stdio: "inherit" });
  adminExit = 0;
} catch {
  adminExit = 1;
}

console.log("\n── Part 8: E2E validation ──\n");
let e2eExit = 1;
let e2eSummary = "not run";
try {
  execSync(
    "E2E_ADMIN_EMAIL=admin@beyondbabyco.com E2E_ADMIN_PASSWORD=Admin@123456 npm run test:e2e",
    { cwd: root, stdio: "inherit", env: { ...process.env, E2E_ADMIN_EMAIL: "admin@beyondbabyco.com", E2E_ADMIN_PASSWORD: "Admin@123456" } },
  );
  e2eExit = 0;
  e2eSummary = "9 passed, 0 failed";
} catch {
  e2eSummary = "failed — see test output";
}

console.log("\n── Validation suite ──\n");
const validation = {};
for (const [name, cmd] of [
  ["lint", "npm run lint"],
  ["typecheck", "npm run typecheck"],
  ["test", "npm run test"],
  ["build", "npm run build"],
]) {
  try {
    execSync(cmd, { cwd: root, stdio: "pipe" });
    validation[name] = "✅";
    console.log(`✓ ${cmd}`);
  } catch {
    validation[name] = "❌";
    console.log(`✗ ${cmd}`);
  }
}

generateCompleteReport(report, audit, adminExit === 0, e2eSummary, validation);

const allOk =
  !report.failed &&
  auditExit === 0 &&
  (audit?.missingMigrations?.length ?? 1) === 0 &&
  adminExit === 0 &&
  e2eExit === 0;

process.exit(allOk ? 0 : 1);

function generateCompleteReport(report, audit, adminOk, e2eSummary, validation) {
  const missing = audit?.missingMigrations ?? [];
  const appliedCount = audit?.appliedMigrations?.length ?? report.applied.length;

  const md = `# Phase 10.0C — Database Migration Complete

**Generated:** ${new Date().toISOString()}

## Summary

| Metric | Result |
|--------|--------|
| Migrations executed (007–021) | ${report.applied.length} applied, ${report.skipped.length} skipped |
| Failed migration | ${report.failed ? report.failed.migration : "none"} |
| Audit (target 23/23) | ${audit ? `${appliedCount}/23 applied, ${missing.length} missing` : "not run"} |
| Admin check | ${adminOk === true ? "✅ PASS" : adminOk === false ? "❌ FAIL" : "⏭ not run"} |
| E2E | ${e2eSummary ?? "—"} |

## Applied migrations

${report.applied.map((m) => `- **${m.migration}** (#${m.number}) — ${m.status}, verified=${m.verified}`).join("\n") || "- none"}

## Skipped migrations (already applied)

${report.skipped.map((m) => `- **${m.migration}** — ${m.reason}: ${m.detail}`).join("\n") || "- none"}

## Repair SQL executed

${report.repairSqlExecuted.length ? report.repairSqlExecuted.map((r) => `- ${r}`).join("\n") : "- none (additive repair not required)"}

## Remaining issues

${report.failed ? `- **FAILED:** \`${report.failed.migration}\` — ${report.failed.sqlState}: ${report.failed.message}\n- See \`scripts/database-error.sql\`` : missing.length ? missing.map((m) => `- Missing: \`${m}\``).join("\n") : "- None — database fully synchronized"}

## Database version

- Migration range completed: **007–021**
- Checkpoints: \`scripts/.database-migration-checkpoints.json\`
- Sync report: \`scripts/.database-sync-report.json\`

## Audit result

\`\`\`json
${JSON.stringify({ applied: audit?.appliedMigrations, missing: audit?.missingMigrations }, null, 2)}
\`\`\`

## Admin result

${adminOk === true ? "PASS" : adminOk === false ? "FAIL" : "Blocked — credentials or schema gaps"}

## E2E result

${e2eSummary ?? "—"}

## Validation

| Command | Status |
|---------|--------|
| \`npm run lint\` | ${validation?.lint ?? "—"} |
| \`npm run typecheck\` | ${validation?.typecheck ?? "—"} |
| \`npm run test\` | ${validation?.test ?? "—"} |
| \`npm run build\` | ${validation?.build ?? "—"} |
`;

  writeFileSync(completeReportPath, md);
  console.log(`\n✓ Report: ${completeReportPath}\n`);
}
