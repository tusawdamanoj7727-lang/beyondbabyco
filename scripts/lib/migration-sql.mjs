/**
 * SQL parsing helpers for migration sync/repair.
 */

const ON_CONFLICT_RE = /\bon\s+conflict\s*(?:\(([^)]+)\))?(?:\s+where\s+[^;]+)?\s+do\s+/i;

/** Split SQL on semicolons, respecting comments, dollar-quotes, and strings. */
export function splitSqlStatements(sql) {
  const statements = [];
  let buf = "";
  let i = 0;
  const len = sql.length;
  let inSingle = false;
  let dollarTag = null;
  let inLineComment = false;
  let inBlockComment = false;

  while (i < len) {
    if (inLineComment) {
      if (sql[i] === "\n") {
        inLineComment = false;
        buf += "\n";
      }
      i++;
      continue;
    }

    if (inBlockComment) {
      if (sql[i] === "*" && sql[i + 1] === "/") {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    if (dollarTag === null && !inSingle && sql[i] === "-" && sql[i + 1] === "-") {
      inLineComment = true;
      i += 2;
      continue;
    }

    if (dollarTag === null && !inSingle && sql[i] === "/" && sql[i + 1] === "*") {
      inBlockComment = true;
      i += 2;
      continue;
    }

    if (dollarTag === null && !inSingle && sql[i] === "$") {
      const match = sql.slice(i).match(/^(\$[a-zA-Z0-9_]*\$)/);
      if (match) {
        dollarTag = match[1];
        buf += match[1];
        i += match[1].length;
        continue;
      }
    }

    if (dollarTag !== null) {
      if (sql.slice(i, i + dollarTag.length) === dollarTag) {
        buf += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      buf += sql[i++];
      continue;
    }

    if (sql[i] === "'" && !inSingle) {
      inSingle = true;
      buf += sql[i++];
      continue;
    }
    if (sql[i] === "'" && inSingle) {
      if (sql[i + 1] === "'") {
        buf += "''";
        i += 2;
        continue;
      }
      inSingle = false;
      buf += sql[i++];
      continue;
    }

    if (sql[i] === ";" && !inSingle && dollarTag === null) {
      const trimmed = buf.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      buf = "";
      i++;
      continue;
    }

    buf += sql[i++];
  }

  const tail = buf.trim();
  if (tail) {
    statements.push(tail);
  }

  return statements;
}

/** Extract ON CONFLICT target columns from an INSERT statement. */
export function parseOnConflict(statement) {
  const m = statement.match(ON_CONFLICT_RE);
  if (!m) return null;
  const cols = m[1]
    ? m[1].split(",").map((c) => c.trim().replace(/"/g, ""))
    : null;
  return { columns: cols, inference: cols ? "columns" : "primary_key" };
}

/** Parse INSERT target table from statement. */
export function parseInsertTable(statement) {
  const m = statement.match(/\binsert\s+into\s+(?:only\s+)?([a-zA-Z0-9_."]+)/i);
  if (!m) return null;
  return m[1].replace(/"/g, "").replace(/^public\./, "");
}

/** Check whether statement contains ON CONFLICT. */
export function hasOnConflict(statement) {
  return ON_CONFLICT_RE.test(statement);
}

/**
 * Verify unique/PK constraint exists for ON CONFLICT target.
 * @param {import('pg').Client} client
 */
export async function verifyConflictConstraint(client, tableName, conflict) {
  const schema = "public";
  const table = tableName.split(".").pop();

  const { rows: constraints } = await client.query(
    `select c.conname, c.contype, pg_get_constraintdef(c.oid) as def
     from pg_constraint c
     join pg_class t on t.oid = c.conrelid
     join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = $1 and t.relname = $2 and c.contype in ('p','u')`,
    [schema, table],
  );

  const { rows: indexes } = await client.query(
    `select indexname, indexdef
     from pg_indexes
     where schemaname = $1 and tablename = $2`,
    [schema, table],
  );

  if (!conflict.columns) {
    const hasPk = constraints.some((c) => c.contype === "p");
    return {
      ok: hasPk,
      expected: "PRIMARY KEY",
      constraints: constraints.map((c) => c.def),
      indexes: indexes.map((i) => i.indexdef),
    };
  }

  const cols = conflict.columns;

  for (const c of constraints) {
    if (c.contype === "u" || c.contype === "p") {
      const colMatch = cols.every((col) => c.def.includes(col));
      if (colMatch) {
        return { ok: true, matched: c.conname, constraints: [c.def], indexes: [] };
      }
    }
  }

  for (const idx of indexes) {
    const isUnique = idx.indexdef.toLowerCase().includes("unique");
    if (!isUnique) continue;
    const allCols = cols.every((col) => idx.indexdef.includes(col));
    const isPartial = idx.indexdef.toLowerCase().includes(" where ");
    if (allCols && !isPartial) {
      return { ok: true, matched: idx.indexname, indexes: [idx.indexdef], constraints: [] };
    }
    if (allCols && isPartial) {
      return {
        ok: false,
        reason: "partial_unique_index",
        expected: `UNIQUE (${cols.join(", ")}) or ON CONFLICT (${cols.join(", ")}) WHERE ... matching partial index`,
        indexes: [idx.indexdef],
        constraints: constraints.map((c) => c.def),
      };
    }
  }

  return {
    ok: false,
    reason: "missing_constraint",
    expected: `UNIQUE (${cols.join(", ")}) or PRIMARY KEY including (${cols.join(", ")})`,
    constraints: constraints.map((c) => c.def),
    indexes: indexes.map((i) => i.indexdef),
  };
}

export function truncateStatement(statement, max = 240) {
  const oneLine = statement.replace(/\s+/g, " ").trim();
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max)}…`;
}
