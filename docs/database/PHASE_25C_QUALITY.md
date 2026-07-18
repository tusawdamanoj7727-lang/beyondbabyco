# Phase 2.5C — Database Quality Review

Read-only audit + safe recommendations. Apply schema changes only when low-risk and reversible.

## Applied in this phase

None. No destructive cleanup migrations were required for V1.0 readiness.

## Verified healthy (prior phases)

- Unique product slugs (application + DB constraints from earlier migrations)
- `shipments` one-per-order (`057_shipments_one_per_order.sql`)
- Razorpay payment id uniqueness (`050_razorpay_payment_id_unique.sql`)
- Shared rate-limit buckets + RPC (`058_ops_reliability.sql`)
- Webhook / shipment tracking dedupe indexes (`058`)

## Recommended (do not apply blindly in production)

| Priority | Item | Rationale | Risk |
|----------|------|-----------|------|
| Medium | Audit open RLS `WITH CHECK (true)` on newsletter / waitlist / contact | Anon PostgREST inserts possible if keys leaked | Behavior change — route through server APIs first |
| Medium | Index review on `order_email_logs(status)` if failed-email cron slows | Ops cron scans failed rows | Low if `CREATE INDEX CONCURRENTLY` |
| Low | Remove unused demo / legacy columns after inventory | Maintainability | Requires column-usage audit |
| Low | Resolve duplicate migration number prefixes (038, 044, 052) | Clarity for future migrations | Rename only if never applied under old names |
| Info | Child catalog tables with `USING (true)` | Confirm unpublished products cannot leak via direct table reads | Query-path dependent |

## Integrity checklist (ops)

```sql
-- Duplicate active product slugs
select slug, count(*) from products where deleted_at is null group by 1 having count(*) > 1;

-- Shipments missing tracking (Delhivery backlog)
select count(*) from shipments where carrier = 'Delhivery' and tracking_number is null;

-- Unprocessed payment webhooks
select count(*) from payment_webhooks where processed = false;

-- Failed transactional emails
select template_id, count(*) from order_email_logs where status = 'failed' group by 1;
```

## Policy

- Prefer **forward-fix** migrations over DROP.
- Never drop tables/columns without a 30-day unused confirmation.
- Use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` for all prod SQL.
