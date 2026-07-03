# Backup Strategy

## Supabase (recommended)

1. **Daily automated backups** — Enable on Supabase Pro plan (point-in-time recovery)
2. **Manual snapshot** before major migrations:
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```
3. **Storage** — Supabase dashboard → Storage → export critical buckets periodically

## Application level

- Audit logs retained in `audit_logs` table — include in DB backups
- Report exports in `report_exports` — optional archival to cold storage

## Restore procedure

1. Create new Supabase project or restore from PITR
2. Verify RLS policies active
3. Update `NEXT_PUBLIC_SUPABASE_URL` in deployment
4. Run health check: `GET /api/health`
5. Verify admin login and sample CRUD

## RTO / RPO targets (suggested)

| Metric | Target |
|--------|--------|
| RPO | 24 hours (daily backup) or 5 min (PITR) |
| RTO | 2 hours |
