# BeyondBabyCo v1.0.0 — Production Rollback Plan

**Date:** 2026-07-01  
**Version:** 1.0.0  
**Trigger:** Critical production incident (payments broken, data corruption, security breach, widespread 5xx)

---

## Decision Criteria

Roll back when ANY of the following occur and cannot be hot-fixed within **15 minutes**:

- Payment or checkout failure rate > 5%
- `/api/health` returning 503 for > 5 consecutive minutes
- Confirmed security incident (credential leak, RLS bypass)
- Database migration caused data loss or corruption
- Error rate in Sentry spikes > 10× baseline

---

## 1. Deployment Rollback

### Vercel (recommended)

1. Open Vercel Dashboard → Project → Deployments
2. Identify last known-good deployment (pre-incident)
3. Click **⋯ → Promote to Production**
4. Verify `GET https://your-domain/api/health` → `{ "status": "ok" }`
5. Smoke test: homepage, `/products`, admin login

**Time target:** < 5 minutes

### Docker / self-hosted

1. Identify previous image tag: `beyondbabyco:v1.0.0-previous`
2. Stop current container: `docker compose down`
3. Deploy previous image:
   ```bash
   docker compose up -d --no-build
   # or: docker run -d --env-file .env.production beyondbabyco:previous
   ```
4. Verify healthcheck passes (compose polls `/api/health` every 30s)

**Time target:** < 10 minutes

---

## 2. Environment Rollback

1. **Do not rotate secrets during rollback** unless breach confirmed
2. If bad env var caused incident:
   - Restore previous values from secret manager / Vercel env history
   - Redeploy (no code change needed)
3. Critical vars to verify after rollback:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL` / keys
   - `RAZORPAY_*`, `DELHIVERY_*`, `EMAIL_*`, `CRON_SECRET`

---

## 3. Database Rollback

> **Never roll back schema in production without backup verification.**

### If migration caused issue

1. Stop application traffic (maintenance mode or DNS pause)
2. Restore from Supabase PITR (Pro) or latest `pg_dump`:
   ```bash
   pg_restore -d $DATABASE_URL backup-YYYYMMDD.sql
   ```
3. Re-apply only verified migrations if needed
4. Verify RLS policies active (Supabase Dashboard → Authentication → Policies)
5. Run `npm run audit:database` against restored instance
6. Resume traffic; verify admin login + sample order read

**Time target:** 30–120 minutes (depends on backup method)

### If data-only corruption (no schema change)

1. Identify affected tables from audit logs
2. Restore specific tables from backup snapshot
3. Reconcile order/payment state manually via admin

---

## 4. CDN / Static Asset Rollback

- Next.js hashed assets (`/_next/static/*`) are immutable — old deployment retains old hashes
- Promoting previous Vercel deployment automatically serves previous static bundles
- Supabase Storage: restore bucket from Supabase backup if media corrupted
- `/public/images/*`: revert git commit and redeploy if static assets changed

---

## 5. Docker Image Rollback

```bash
# Tag convention
beyondbabyco:1.0.0          # current
beyondbabyco:1.0.0-rc1        # previous candidate

# Rollback
docker tag beyondbabyco:1.0.0-rc1 beyondbabyco:latest
docker compose up -d
```

Keep at least **2 previous image tags** in registry.

---

## 6. Monitoring During Rollback

| Check | Command / URL | Expected |
|-------|---------------|----------|
| Health | `GET /api/health` | `status: ok` |
| Database | `GET /api/health/database` | `status: ok` |
| Storage | `GET /api/health/storage` | `status: ok` |
| Sentry | Dashboard error rate | Declining |
| Payments | Test Razorpay sandbox transaction | Success |
| Admin | Login + view orders | Success |

---

## 7. Post-Rollback

1. Document incident timeline in ops log
2. Create post-mortem within 48 hours
3. Fix forward in staging before re-deploying
4. Notify stakeholders if customer-facing impact occurred
5. Verify webhook endpoints still registered with Razorpay/Delhivery

---

## Contacts (fill before launch)

| Role | Name | Contact |
|------|------|---------|
| Engineering lead | _TBD_ | |
| DevOps | _TBD_ | |
| On-call | _TBD_ | |
