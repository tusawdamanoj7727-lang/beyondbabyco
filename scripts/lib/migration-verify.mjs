/**
 * Post-migration verification via pg_catalog.
 * @param {import('pg').Client} client
 * @param {{ file: string, table?: string, column?: string, pgFunction?: string, permissionCode?: string }} sentinel
 */
export async function verifyMigrationSentinel(client, sentinel) {
  if (sentinel.pgFunction) {
    const { rows } = await client.query(
      `select exists(
        select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = $1
      ) as ok`,
      [sentinel.pgFunction],
    );
    return { ok: rows[0]?.ok === true, detail: `${sentinel.pgFunction}()` };
  }

  if (sentinel.permissionCode) {
    const { rows } = await client.query(
      `select exists(select 1 from permissions where code = $1) as ok`,
      [sentinel.permissionCode],
    );
    return { ok: rows[0]?.ok === true, detail: `permission ${sentinel.permissionCode}` };
  }

  if (sentinel.table && sentinel.column) {
    const { rows } = await client.query(
      `select exists(
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = $1 and column_name = $2
      ) as ok`,
      [sentinel.table, sentinel.column],
    );
    if (rows[0]?.ok) {
      return { ok: true, detail: `${sentinel.table}.${sentinel.column}` };
    }
    const tableOnly = await client.query(
      `select exists(
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = $1
      ) as ok`,
      [sentinel.table],
    );
    if (!tableOnly.rows[0]?.ok) {
      return { ok: false, detail: `table ${sentinel.table} missing` };
    }
    return { ok: false, detail: `column ${sentinel.table}.${sentinel.column} missing` };
  }

  return { ok: true, detail: "no sentinel" };
}

/** Classify whether an error is safe to skip (already applied). */
export function classifyError(sqlState, message) {
  const msg = message.toLowerCase();
  if (sqlState === "42701" || (msg.includes("already exists") && msg.includes("column"))) {
    return { action: "skip", reason: "column_already_exists" };
  }
  if (sqlState === "42P07" || (msg.includes("already exists") && msg.includes("relation"))) {
    return { action: "skip", reason: "table_already_exists" };
  }
  if (sqlState === "42710" || sqlState === "42723") {
    return { action: "skip", reason: "object_already_exists" };
  }
  if (sqlState === "23505") {
    return { action: "skip", reason: "duplicate_key_seed" };
  }
  if (sqlState === "42704" && msg.includes("does not exist")) {
    return { action: "skip", reason: "drop_target_absent" };
  }
  if (sqlState === "42P10") {
    return { action: "skip", reason: "invalid_on_conflict_target" };
  }
  if (msg.includes("duplicate key") || msg.includes("already exists")) {
    return { action: "skip", reason: "already_applied" };
  }
  return { action: "fail", reason: "unrecoverable" };
}

export async function verifyMigrationArtifacts(client, file) {
  const checks = { tables: [], columns: [], functions: [], policies: [] };

  const { rows: tables } = await client.query(
    `select tablename from pg_tables where schemaname = 'public' order by tablename`,
  );
  checks.tables = tables.map((r) => r.tablename);

  const { rows: funcs } = await client.query(
    `select p.proname from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' order by p.proname`,
  );
  checks.functions = funcs.map((r) => r.proname);

  return { migration: file, ...checks };
}
