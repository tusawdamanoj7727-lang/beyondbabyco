# BeyondBabyCo v1.0.0 — Disaster Recovery Plan

**Date:** 2026-07-01  
**Version:** 1.0.0  
**Related:** `docs/database/BACKUP_STRATEGY.md`, `docs/PRODUCTION_ROLLBACK_PLAN.md`

---

## Recovery Objectives

| Metric | Target (recommended) | Tier |
|--------|---------------------|------|
| **RPO** (max data loss) | 5 min (PITR) / 24h (daily backup) | Supabase Pro / Free |
| **RTO** (max downtime) | 2 hours | Full platform restore |

---

## 1. Backup Strategy

### Database (Supabase Postgres)

| Method | Frequency | Retention | Location |
|--------|-----------|-----------|----------|
| Supabase automated backup | Daily | 7 days (Pro) | Supabase managed |
| Point-in-time recovery (PITR) | Continuous | 7 days (Pro) | Supabase managed |
| Manual `pg_dump` | Before major migrations | 90 days | Secure off-site storage |

```bash
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d-%H%M).sql
```

**Pre-launch:** Run manual dump after applying `APPLY_ALL.sql` and seeding production data.

### Storage (Supabase Storage)

| Bucket | Content | Backup method |
|--------|---------|---------------|
| `products` | Product images | Supabase bucket export + CDN cache |
| `media_library` | CMS / marketing assets | Same |

Export via Supabase Dashboard → Storage → bucket → download critical prefixes monthly.

### Application secrets

| Store | Backup |
|-------|--------|
| Vercel env vars | Export via dashboard / CLI |
| `.env.production` | Password manager (1Password, etc.) — never git |
| Razorpay/Delhivery keys | Provider dashboards (regenerate if lost) |

### Code / deployment

| Asset | Recovery |
|-------|----------|
| Application code | GitHub `main` branch + tag `v1.0.0` |
| Docker images | Registry tags `beyondbabyco:1.0.0` |
| Migrations | `supabase/database/APPLY_ALL.sql` + `supabase/migrations/` |

---

## 2. Disaster Scenarios & Recovery

### Scenario A: Complete Supabase outage

1. Check [Supabase Status](https://status.supabase.com)
2. If regional outage: wait for provider recovery (no action)
3. If project deleted/corrupted:
   - Create new Supabase project
   - Restore from latest `pg_dump` or PITR
   - Update env vars: `NEXT_PUBLIC_SUPABASE_URL`, keys
   - Re-deploy application
   - Re-register webhooks (Razorpay, Delhivery)
   - Verify RLS policies via `npm run audit:database`

**RTO:** 1–2 hours

### Scenario B: Vercel / hosting outage

1. Check provider status page
2. If extended outage: deploy Docker image to alternate host (Railway, Fly.io, AWS)
3. Point DNS to alternate host
4. Verify `/api/health`

**RTO:** 30–60 minutes (if Docker image ready)

### Scenario C: Credential compromise

1. **Immediately rotate:**
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard)
   - `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - `DELHIVERY_API_KEY`, `DELHIVERY_WEBHOOK_SECRET`
   - `CRON_SECRET`, `RESEND_API_KEY`
   - `SENTRY_DSN` (optional)
2. Update all deployment env vars
3. Redeploy
4. Review `audit_logs` for unauthorized access
5. Re-register webhooks with new secrets

**RTO:** 30 minutes

### Scenario D: Storage bucket deletion

1. Restore bucket from Supabase backup export
2. If no backup: re-upload from local `public/images` + admin media library exports
3. Run `npm run image:backfill-products` if needed
4. Verify PDP images load

**RTO:** 2–4 hours

### Scenario E: Bad deployment (code bug)

See `docs/PRODUCTION_ROLLBACK_PLAN.md` — promote previous deployment.

**RTO:** < 10 minutes

---

## 3. Restore Procedure (Database)

```bash
# 1. Stop traffic (optional maintenance page)

# 2. Restore dump
psql "$DATABASE_URL" < backup-YYYYMMDD.sql

# 3. Verify schema
npm run audit:database

# 4. Verify admin
npm run check:admin

# 5. Health check
curl -s https://your-domain/api/health | jq .

# 6. Smoke test
# - Admin login
# - View products
# - View recent orders

# 7. Resume traffic
```

---

## 4. Infrastructure Recovery Checklist

- [ ] DNS records documented (A/CNAME, TTL)
- [ ] SSL certificate auto-renewal confirmed
- [ ] Supabase project ID and region documented
- [ ] Vercel project linked to GitHub repo
- [ ] Docker registry credentials stored securely
- [ ] Webhook URLs documented for Razorpay + Delhivery
- [ ] Cron scheduler config documented (Vercel Cron / external)

---

## 5. Quarterly DR Drill

1. Restore latest backup to **staging** Supabase project
2. Point staging app at restored DB
3. Verify: health, admin login, product browse, order read
4. Document actual RTO achieved
5. Update this document with lessons learned

**Last drill:** _Not yet performed — schedule before launch +1 month_

---

## 6. Data Retention

| Data | Retention | Notes |
|------|-----------|-------|
| `audit_logs` | Indefinite (in DB backup) | Compliance |
| `payment_logs` | Indefinite | Financial audit |
| `email_queue` | 90 days (recommended cleanup job) | Ops |
| Sentry events | 90 days (plan dependent) | Error tracking |
| GA4 data | 14 months default | Analytics |
