/**
 * Phase 2.5A — Backfill Delhivery AWBs for confirmed orders missing tracking.
 * Idempotent via fulfillOrderWithDelhivery (one shipment / AWB per order).
 *
 *   npx tsx scripts/phase-25a-backfill-awbs.ts
 */
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { config } from "dotenv";
import pg from "pg";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  // Allow importing server-only modules from a Node CLI script.
  const require = createRequire(import.meta.url);
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
  } as NodeModule;

  const { fulfillOrderWithDelhivery } = await import("../src/lib/checkout/fulfillment");

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const { rows } = await client.query<{
    id: string;
    order_number: string;
    method: string;
    payment_status: string;
  }>(`
    select o.id, o.order_number, p.method, p.status as payment_status
    from orders o
    join lateral (
      select method, status
      from payments
      where order_id = o.id
      order by created_at desc
      limit 1
    ) p on true
    left join shipments s on s.order_id = o.id
    where o.status = 'confirmed'
      and (
        (lower(coalesce(p.method, '')) = 'cod' and p.status in ('pending', 'authorized', 'paid', 'captured'))
        or (lower(coalesce(p.method, '')) <> 'cod' and p.status in ('paid', 'captured'))
      )
      and (s.id is null or s.tracking_number is null or btrim(s.tracking_number) = '')
    order by o.created_at asc
  `);

  console.log(JSON.stringify({ scope: "backfill_awb", candidates: rows.length }));

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const result = await fulfillOrderWithDelhivery(row.id);
    const line = {
      order_number: row.order_number,
      method: row.method,
      payment_status: row.payment_status,
      ok: result.ok,
      skipped: Boolean(result.skipped),
      awb: result.awb || null,
      error: result.error,
    };
    console.log(JSON.stringify(line));
    if (!result.ok) failed += 1;
    else if (result.skipped) skipped += 1;
    else if (result.awb) created += 1;
    await new Promise((r) => setTimeout(r, 750));
  }

  console.log(
    JSON.stringify({
      scope: "backfill_awb_summary",
      candidates: rows.length,
      created,
      skipped,
      failed,
    }),
  );
  await client.end();
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
