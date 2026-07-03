# Database — Migration Audit

## Inventory (21 migrations)

| # | File | Phase |
|---|------|-------|
| 001 | initial_schema | Core schema |
| 002 | indexes | Performance |
| 003 | rls | Security |
| 004 | storage | Buckets |
| 005 | seed | Permissions |
| 006–008 | auth, products, categories | Admin |
| 009–012 | media, homepage, inventory, orders | Operations |
| 013–017 | customers, reviews, returns, coupons, shipping | Sales |
| 018–021 | payments, reports, finance, marketing | Enterprise |

## Validation

```bash
npm run validate:migrations
npm run test  # includes tests/integration/migrations.test.ts
```

## Idempotency patterns

All migrations use:

- `CREATE TABLE IF NOT EXISTS`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `INSERT ... ON CONFLICT DO NOTHING`
- `DROP POLICY IF EXISTS` before recreate

## Index audit

Key indexes in `002_indexes.sql` plus per-migration indexes on:

- Foreign keys (order_id, customer_id, etc.)
- Status columns for list filters
- Composite indexes on ledger, campaigns, shipments

**Recommendation:** Run `EXPLAIN ANALYZE` on slow admin list queries in production.

## Seed strategy

- `005_seed.sql` — roles, permissions, role_permissions
- Module migrations seed preset data (segments, automation workflows)
- No destructive re-seeds; use `ON CONFLICT DO NOTHING`

## Rollback

See [ROLLBACK.md](./ROLLBACK.md).

## Backup

See [BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md).
