# BeyondBabyCo v1.0.0 — Production Monitoring Plan

**Date:** 2026-07-01  
**Version:** 1.0.0

---

## Overview

Monitoring spans automated health probes, error tracking, integration dashboards, and manual ops reviews. Primary surfaces: `/api/health`, Sentry, `/admin/operations/*`, and external uptime monitors.

---

## 1. Health Monitoring

| Endpoint | Frequency | Alert if | Tool |
|----------|-----------|----------|------|
| `GET /api/health` | 1 min | `status != ok` or 503 | UptimeRobot / Better Stack / Vercel |
| `GET /api/health/database` | 5 min | `status: error` | Custom monitor |
| `GET /api/health/storage` | 15 min | `status: error` | Custom monitor |
| `GET /api/health/memory` | 15 min | `status: degraded` (>90% heap) | Custom monitor |

**Response contract:** `{ status: "ok" | "degraded" | "error", checks: [...] }`

Production responses sanitize internal error details.

---

## 2. Payments Monitoring

| Signal | Source | Alert threshold |
|--------|--------|-----------------|
| Webhook failures | Sentry + `payment_logs` | > 3 failures / hour |
| Invalid signatures | Razorpay webhook 401 logs | Any in production |
| Checkout completion rate | GA4 `purchase` events | Drop > 20% vs 7-day avg |
| Gateway health | `/admin/operations/integrations` | Manual weekly |

**Webhook URLs to monitor:**
- `{APP_URL}/api/webhooks/payments/{gatewayId}`
- Razorpay Dashboard → Webhooks → delivery status

---

## 3. Orders Monitoring

| Signal | Source | Action |
|--------|--------|--------|
| Stuck orders (paid, unfulfilled > 24h) | Admin `/admin/orders` filter | Ops review daily |
| Order creation errors | Sentry | Page on-call |
| COD vs online ratio | `/admin/analytics/payments` | Weekly review |

---

## 4. Email Monitoring

| Signal | Source | Alert |
|--------|--------|-------|
| Queue depth | `GET /api/health/queue` | > 100 queued |
| Send failures | `email_queue` status = failed | > 5 / hour |
| Provider health | `/admin/operations/integrations` | Test send weekly |

---

## 5. Cron Monitoring

| Job | Endpoint | Schedule | Alert if |
|-----|----------|----------|----------|
| Delhivery sync | `GET /api/cron/sync-shipments` | Every 15–30 min | No success in 1 hour |

**Auth:** `Authorization: Bearer {CRON_SECRET}`

Verify via:
```bash
npm run cron:sync-shipments
```

---

## 6. Analytics Monitoring

| Provider | Env var | Verify |
|----------|---------|--------|
| GA4 | `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Realtime dashboard after deploy |
| Meta Pixel | `NEXT_PUBLIC_META_PIXEL_ID` | Events Manager test events |
| Clarity | `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Session recordings within 24h |
| Search Console | `NEXT_PUBLIC_GSC_VERIFICATION` | Property verified post-launch |

Deferred `lazyOnload` loading — verify events fire on navigation, checkout, purchase.

---

## 7. Error Monitoring (Sentry)

| Config | Value |
|--------|-------|
| DSN | `SENTRY_DSN` |
| Environment | `SENTRY_ENVIRONMENT=production` |
| Release | `SENTRY_RELEASE=1.0.0` |
| Sample rate | `SENTRY_TRACES_SAMPLE_RATE=0.1` |

**Alert rules (configure in Sentry):**
- New issue in production → Slack/email
- Error rate > 50/min → page on-call
- Unhandled rejection in checkout/payment routes → immediate

---

## 8. Performance Monitoring

| Metric | Target | Tool |
|--------|--------|------|
| LCP | < 2.5s | GA4 Web Vitals / Lighthouse CI |
| CLS | < 0.05 | GA4 Web Vitals |
| INP | < 150ms | GA4 Web Vitals |
| TTFB | < 600ms (edge) | Vercel Analytics |
| API p95 latency | < 500ms | Sentry performance |

**Post-deploy:** Run `npm run lighthouse:cert` against production URL within 24h of launch.

Admin dashboard: `/admin/operations/performance`

---

## 9. Security Monitoring

| Signal | Source | Frequency |
|--------|--------|-----------|
| Failed admin logins | `audit_logs` | Daily review |
| CSRF 403 spikes | Server logs / Sentry | Alert > 10/hour |
| Webhook auth failures | API logs | Alert any in prod |
| Rate limit hits | Middleware logs | Weekly review |

Dashboard: `/admin/operations/security`

---

## 10. Daily / Weekly Ops Cadence

### Daily (automated + 5 min human)
- [ ] `/api/health` green
- [ ] Sentry: no new P0 issues
- [ ] Email queue depth normal
- [ ] Cron last run < 30 min ago

### Weekly
- [ ] Review `/admin/operations/deployment` checklist
- [ ] Test email send from integrations page
- [ ] Check Delhivery webhook delivery log
- [ ] Review GA4 conversion funnel
- [ ] Audit log spot check

### Monthly
- [ ] Lighthouse production audit
- [ ] Secret rotation review (no leaks)
- [ ] Backup restore drill (see `docs/DISASTER_RECOVERY.md`)

---

## Alert Escalation

| Severity | Response time | Channel |
|----------|---------------|---------|
| P0 (site down, payments broken) | 15 min | Page + phone |
| P1 (degraded, partial outage) | 1 hour | Slack |
| P2 (non-critical) | Next business day | Ticket |
