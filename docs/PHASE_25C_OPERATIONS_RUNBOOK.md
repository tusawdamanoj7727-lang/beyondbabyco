# Phase 2.5C — Operations Runbook

Canonical ops guide for production (Vercel + Supabase + Razorpay + Delhivery).

## Deployment

1. Push to `main` → Vercel Production deploy.
2. Hobby plan: Vercel crons are **daily only**. Sub-daily jobs run via GitHub Actions (`.github/workflows/ops-crons.yml`).
3. Required GitHub secrets: `CRON_SECRET`, `SITE_URL=https://beyondbabyco.in`.
4. After deploy: `curl -sS https://beyondbabyco.in/api/health` → expect `"status":"ok"|"degraded"`.

## Environment variables (critical)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server jobs, ops health, rate limits |
| `CRON_SECRET` | Cron + detailed health Bearer |
| `HEALTH_CHECK_SECRET` | Optional override for health Bearer |
| `RAZORPAY_*` + webhook secret | Payments |
| `DELHIVERY_*` + `DELHIVERY_WEBHOOK_SECRET` | Shipping |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | Transactional email |
| `SENTRY_DSN` | Error reporting (recommended) |

Never put secrets in query strings. SMTP diagnostics accept **Bearer** only.

## Cron jobs

| Path | Cadence (Actions) | Vercel Hobby fallback |
|------|-------------------|------------------------|
| `/api/cron/expire-reservations` | every 5 min | daily 02:00 UTC |
| `/api/cron/sync-shipments` | every 15 min | daily 03:00 UTC |
| `/api/cron/retry-emails` | every 10 min | daily 04:00 UTC |
| `/api/cron/replay-webhooks` | every 10 min | daily 05:00 UTC |

Invoke manually:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://beyondbabyco.in/api/cron/sync-shipments
```

## Health & monitoring

- **Public** `GET /api/health` — env + database only (rate-limited 30/min).
- **Authorized** `GET /api/health` with `Authorization: Bearer $CRON_SECRET` — storage, queues, memory, ops signals (failed emails, unprocessed webhooks, missing AWBs).
- Sub-routes (`/api/health/smtp`, `/database`, …) require Bearer.
- Configure uptime checks against public `/api/health` (expect 200; `degraded` is still 200 unless DB/env error → 503).

## Webhooks

| Provider | Route | Auth |
|----------|-------|------|
| Razorpay | `/api/webhooks/payments/[gatewayId]` | HMAC signature |
| Delhivery | `/api/webhooks/delhivery` | `x-delhivery-webhook-token` (timing-safe) |

Failures leave `payment_webhooks.processed = false` for cron replay. Never treat failed processing as permanent ACK.

## Refunds

1. Admin → Payments / Order → refund (partial or full).
2. System calls Razorpay refund API and stores `order_refunds.gateway_refund_id`.
3. Audit via `log_audit` + `payment_logs`.
4. If gateway succeeds but DB write fails, reconcile using Razorpay dashboard + `gateway_refund_id` unique index.

## Shipping recovery

1. Confirm Delhivery wallet balance.
2. Run AWB backfill script if shipments lack `tracking_number`.
3. Cron `sync-shipments` polls Delhivery and updates status / tracking events (deduped).

## Email recovery

1. Inspect `order_email_logs` where `status = 'failed'`.
2. Fix SMTP credentials in Vercel if `535 authentication failed`.
3. Cron `retry-emails` re-dispatches failed rows with `force: true`.

## SEO / URL notes

- Canonical host: `https://beyondbabyco.in` (www → apex 308).
- Legacy: `/terms` → `/terms-of-service`, `/return-policy` → `/refund-policy`, `/cookies` → `/privacy-policy`, `/blog` → `/about` (301).
- `/search` is `noindex` and disallowed in robots.

## Related docs

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)
- [MONITORING.md](./MONITORING.md)
- [database/PHASE_25C_QUALITY.md](./database/PHASE_25C_QUALITY.md)
- [database/ROLLBACK.md](./database/ROLLBACK.md)
