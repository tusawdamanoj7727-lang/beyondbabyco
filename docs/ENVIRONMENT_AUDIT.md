# BeyondBabyCo — Production Environment Audit

**Date:** 2026-07-01  
**Phase:** 10.2 Enterprise Production Deployment  
**Reference template:** `.env.example`  
**Runtime validation:** `src/lib/env.validation.ts`, `getProductionEnvWarnings()`

---

## Executive Summary

| Integration | Required for launch | Local `.env.local` | Production action |
|-------------|--------------------|--------------------|-------------------|
| Supabase | **Yes** | ✅ Configured | Verify service role + RLS applied |
| Razorpay | **Yes** | ❌ Missing | Set keys + webhook secret |
| Delhivery | **Yes** | ✅ Configured | Confirm production base URL |
| Email (Resend/SMTP) | **Yes** | ❌ Missing | Set `EMAIL_PROVIDER` + credentials |
| GA4 | Recommended | ❌ Missing | Set measurement ID |
| Meta Pixel | Optional | ❌ Missing | Set pixel ID |
| Microsoft Clarity | Optional | ❌ Missing | Set project ID |
| Sentry | Recommended | ❌ Missing | Set `SENTRY_DSN` |
| Cron | **Yes** | ✅ Configured | Schedule `/api/cron/sync-shipments` |
| AI (ComfyUI) | **No** (dev only) | N/A | Ensure `AI_DEV_ENABLED` ≠ `true` in prod |
| Storage | **Yes** (Supabase) | ✅ Via Supabase | Verify bucket policies |

**Live checklist:** `/admin/operations/deployment` and `/admin/operations/integrations`

---

## 1. Supabase

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | **Yes** | Client + server Supabase endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | **Yes** | RLS-scoped client auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | **Yes** | Admin ops, webhooks, cron (bypass RLS) |
| `DATABASE_URL` | Scripts | Dev/CI | Migration sync (`npm run sync:database`) |
| `SUPABASE_DB_PASSWORD` | Scripts | Alt | Direct Postgres without full URI |

**Validation:** `validatePublicEnv()` throws if URL/anon key missing. Health: `/api/health/database`, `/api/health/supabase`, `/api/health/storage`.

**RLS:** Enabled in `supabase/database/APPLY_ALL.sql` — role policies (`admin_all`, `manager_all`, `staff_read`, `support_manage`) + public read on catalog tables.

**Local status:** URL, anon key, service role, `DATABASE_URL` — all set.

---

## 2. Razorpay

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `RAZORPAY_KEY_ID` | Server | **Yes** | Payment initiation |
| `RAZORPAY_KEY_SECRET` | Server | **Yes** | Server-side API calls |
| `RAZORPAY_WEBHOOK_SECRET` | Server | **Yes** | HMAC SHA256 on `X-Razorpay-Signature` |

**Webhook URL:** `{NEXT_PUBLIC_APP_URL}/api/webhooks/payments/{gateway_uuid}`

**Verification:** Invalid signature → **401**. Replay protection via `X-Razorpay-Event-Id` in `payment_logs`.

**Local status:** ❌ Not configured — payments and webhooks will fail in production without these.

---

## 3. Delhivery

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `DELHIVERY_API_KEY` | Server | **Yes** | Shipment create/track/cancel |
| `DELHIVERY_BASE_URL` | Server | **Yes** | Staging or production API host |
| `DELHIVERY_PICKUP_LOCATION` | Server | Recommended | Pickup name (default: BeyondBabyCo Warehouse) |
| `DELHIVERY_WEBHOOK_SECRET` | Server | **Yes** (prod) | Webhook verification — fail-closed in production |

**Production default:** `https://track.delhivery.com`  
**Staging default:** `https://staging-express.delhivery.com`

**Webhook URL:** `{NEXT_PUBLIC_APP_URL}/api/webhooks/delhivery`

**Local status:** ✅ API key, base URL, pickup location, webhook secret — all set.

---

## 4. Resend / SMTP (Email)

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `EMAIL_PROVIDER` | Server | **Yes** | `resend` \| `sendgrid` \| `ses` \| `smtp` |
| `EMAIL_FROM` | Server | **Yes** | Sender address |
| `EMAIL_FROM_NAME` | Server | Optional | Display name (default: BeyondBabyCo) |
| `EMAIL_REPLY_TO` | Server | Optional | Reply-to header |
| `EMAIL_MAX_RETRIES` | Server | Optional | Default 3 |
| `EMAIL_RETRY_DELAY_MS` | Server | Optional | Default 1000 |

**Provider-specific:**

| Provider | Additional vars |
|----------|-----------------|
| Resend | `RESEND_API_KEY` |
| SendGrid | `SENDGRID_API_KEY` |
| AWS SES | `AWS_SES_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (+ optional SMTP vars) |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` |

**Health:** `checkEmailProviderHealth()` — test send from `/admin/operations/integrations`.

**Local status:** ❌ `EMAIL_PROVIDER` not set — transactional email disabled.

---

## 5. GA4

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Public | Recommended | Google Analytics 4 |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Public | Optional | Search Console meta verification |

**Loading:** Deferred `lazyOnload` (Phase 10.1C). Events: `page_view`, `begin_checkout`, `purchase`.

**Local status:** ❌ Not configured.

---

## 6. Meta Pixel

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `NEXT_PUBLIC_META_PIXEL_ID` | Public | Optional | Facebook/Meta conversion tracking |

**Loading:** Deferred `lazyOnload`. Ops test event available in integrations dashboard.

**Local status:** ❌ Not configured.

---

## 7. Microsoft Clarity

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Public | Optional | Session replay / heatmaps |

**Loading:** Deferred `lazyOnload`.

**Local status:** ❌ Not configured.

---

## 8. Sentry

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `SENTRY_DSN` | Server/Client | Recommended | Primary error tracking |
| `SENTRY_ORG` | Build | Optional | Source map upload |
| `SENTRY_PROJECT` | Build | Optional | Source map upload |
| `SENTRY_ENVIRONMENT` | Server | Optional | Default: `production` |
| `SENTRY_RELEASE` | Server | Optional | Release tagging |
| `SENTRY_TRACES_SAMPLE_RATE` | Server | Optional | Default: `0.1` |

**Alternatives:** `ERROR_TRACKING_DSN`, `ERROR_TRACKING_PROVIDER`, `BETTER_STACK_DSN`, `LOGTAIL_SOURCE_TOKEN`

**Config files:** `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`  
**Build:** `withSentryConfig` in `next.config.ts` when DSN set.

**Local status:** ❌ No DSN configured.

---

## 9. Cron

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `CRON_SECRET` | Server | **Yes** | Bearer auth for cron routes |

**Endpoint:** `GET|POST /api/cron/sync-shipments`  
**Header:** `Authorization: Bearer {CRON_SECRET}`  
**Script:** `npm run cron:sync-shipments`

**Schedule recommendation:** Every 15–30 minutes via Vercel Cron, GitHub Actions, or external scheduler.

**Local status:** ✅ `CRON_SECRET` set (64 chars).

---

## 10. AI (Development Only)

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `AI_PROVIDER` | Server | Dev | Default: `local` |
| `AI_DEV_ENABLED` | Server | **Must be false/absent in prod** | Enables `/dev/ai` and dev API routes |
| `COMFYUI_URL` | Server | Dev | Default: `http://127.0.0.1:8188` |
| `FLUX_MODEL` | Server | Dev | ComfyUI model name |
| `AI_REQUEST_TIMEOUT_MS` | Server | Dev | Default: 120000 |
| `AI_POLL_INTERVAL_MS` | Server | Dev | Default: 1000 |
| `AI_MAX_POLL_ATTEMPTS` | Server | Dev | Default: 180 |

**Production rule:** `getProductionEnvWarnings()` warns if `AI_DEV_ENABLED=true` in production.

---

## 11. Storage (Supabase)

No separate env vars — uses Supabase credentials.

| Bucket | Purpose | CDN |
|--------|---------|-----|
| `products` | Product images | Supabase Storage public URLs |
| `media_library` | CMS / marketing assets | Same |
| (others) | Admin uploads | Configure in Supabase Dashboard |

**Health:** `/api/health/storage` — lists `products` bucket.  
**Image delivery:** `next/image` with `remotePatterns` for `**.supabase.co`.  
**Cache policy:** See `src/lib/media/image-delivery.ts` + `next.config.ts` headers.

---

## 12. Application Core

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Public | **Yes** (prod) | CSRF origin, webhooks, sitemap, OG URLs |
| `NODE_ENV` | Server | Auto | `production` in deploy |
| `DOCKER_BUILD` | Build | Docker | Enables `output: standalone` + HSTS |
| `VERCEL` | Runtime | Vercel | Enables HSTS on Vercel deploys |

**Local status:** `NEXT_PUBLIC_APP_URL=http://localhost:3000` — **must change to HTTPS production URL before launch**.

---

## 13. E2E / CI (Non-production)

| Variable | Purpose |
|----------|---------|
| `PLAYWRIGHT_BASE_URL` | E2E target URL |
| `E2E_ADMIN_EMAIL` | Admin smoke login |
| `E2E_ADMIN_PASSWORD` | Admin smoke login |
| `CI` | Suppresses Sentry upload noise |

---

## Pre-Launch Checklist

```bash
# 1. Copy and fill production values
cp .env.example .env.production.local   # or platform secret manager

# 2. Required minimum
NEXT_PUBLIC_APP_URL=https://beyondbabyco.com   # your domain
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
DELHIVERY_API_KEY=...
DELHIVERY_BASE_URL=https://track.delhivery.com
DELHIVERY_WEBHOOK_SECRET=...
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
EMAIL_FROM=orders@beyondbabyco.com
CRON_SECRET=<64+ char random>
SENTRY_DSN=https://...@sentry.io/...

# 3. Recommended
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-...
NEXT_PUBLIC_META_PIXEL_ID=...
NEXT_PUBLIC_CLARITY_PROJECT_ID=...

# 4. Verify
curl -s https://your-domain/api/health | jq .
# Admin: /admin/operations/deployment
```

---

## Secrets Handling

- **Never commit** `.env.local`, `.env.production`, or platform secrets to git.
- Server secrets accessed via `src/lib/security/secrets.ts` — throws in production if required secret missing.
- Tracked secret keys in ops security dashboard: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `RAZORPAY_KEY_SECRET`, `DELHIVERY_*`, email keys, `SENTRY_DSN`.
