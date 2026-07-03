# BeyondBabyCo v1.0.0 — Go-Live Checklist

**Date:** 2026-07-01  
**Version:** 1.0.0  
**Verdict gate:** All **P0** items must be checked before public launch.

---

## Phase A — Environment & Domain

- [ ] **P0** `NEXT_PUBLIC_APP_URL` set to production HTTPS URL
- [ ] **P0** `NODE_ENV=production` on deploy target
- [ ] DNS A/CNAME pointed to hosting (Vercel or Docker host)
- [ ] SSL/TLS certificate active and auto-renewing
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — production project
- [ ] **P0** `NEXT_PUBLIC_SUPABASE_ANON_KEY` — production anon key
- [ ] **P0** `SUPABASE_SERVICE_ROLE_KEY` — production service role (encrypted in platform)
- [ ] **P0** `CRON_SECRET` — 64+ char random, set in deploy + scheduler
- [ ] Verify no secrets committed to git

---

## Phase B — Payments (Razorpay)

- [ ] **P0** `RAZORPAY_KEY_ID` — live key (not test) when ready for live payments
- [ ] **P0** `RAZORPAY_KEY_SECRET` — live secret
- [ ] **P0** `RAZORPAY_WEBHOOK_SECRET` — from Razorpay Dashboard
- [ ] Webhook URL registered: `{APP_URL}/api/webhooks/payments/{gateway_uuid}`
- [ ] Test payment in Razorpay test mode on staging first
- [ ] COD path verified (no Razorpay required for COD-only orders)
- [ ] Payment gateway configured in admin `/admin/payment-gateways`

---

## Phase C — Shipping (Delhivery)

- [ ] `DELHIVERY_API_KEY` — production key
- [ ] `DELHIVERY_BASE_URL=https://track.delhivery.com`
- [ ] `DELHIVERY_PICKUP_LOCATION` — verified warehouse name
- [ ] `DELHIVERY_WEBHOOK_SECRET` — set
- [ ] Webhook URL registered: `{APP_URL}/api/webhooks/delhivery`
- [ ] Cron scheduled: `GET /api/cron/sync-shipments` every 15–30 min
- [ ] Test shipment create + track on staging

---

## Phase D — Email

- [ ] **P0** `EMAIL_PROVIDER=resend` (or smtp/sendgrid/ses)
- [ ] **P0** `RESEND_API_KEY` (or provider equivalent)
- [ ] **P0** `EMAIL_FROM=orders@yourdomain.com` (verified sender domain)
- [ ] `EMAIL_FROM_NAME=BeyondBabyCo`
- [ ] Test send from `/admin/operations/integrations` succeeds
- [ ] Order confirmation email received on test order

---

## Phase E — Monitoring & Analytics

- [ ] `SENTRY_DSN` — production project
- [ ] `SENTRY_ENVIRONMENT=production`
- [ ] `SENTRY_RELEASE=1.0.0`
- [ ] Test error appears in Sentry dashboard
- [ ] `NEXT_PUBLIC_GA4_MEASUREMENT_ID` — production property
- [ ] GA4 realtime shows page views after deploy
- [ ] `NEXT_PUBLIC_META_PIXEL_ID` — optional
- [ ] `NEXT_PUBLIC_CLARITY_PROJECT_ID` — optional
- [ ] Uptime monitor on `GET /api/health` (1 min interval)
- [ ] Alert rules configured in Sentry

---

## Phase F — SEO & Discovery

- [ ] `NEXT_PUBLIC_GSC_VERIFICATION` — Search Console meta tag
- [ ] Google Search Console property verified
- [ ] `GET /robots.txt` — allows storefront, disallows admin
- [ ] `GET /sitemap.xml` — returns product + content URLs
- [ ] OG images on homepage and key landing pages
- [ ] Favicon and app icons present in `public/`
- [ ] Admin login remains `noindex` (intentional)

---

## Phase G — Database & Security

- [ ] All migrations applied (`APPLY_ALL.sql` or 001–021)
- [ ] RLS enabled on all tables (Supabase Dashboard verify)
- [ ] Admin user bootstrapped (`npm run bootstrap:admin`)
- [ ] Auth redirect URLs include production domain
- [ ] Supabase daily backups enabled (Pro recommended)
- [ ] `AI_DEV_ENABLED` **not** set to `true` in production
- [ ] Security headers verified (CSP, HSTS on HTTPS deploy)
- [ ] Manual `pg_dump` taken pre-launch

---

## Phase H — Deploy & CDN

- [ ] Production build succeeds: `npm run build`
- [ ] Deploy to Vercel (or Docker with `DOCKER_BUILD=1`)
- [ ] Supabase Storage CDN enabled for public buckets
- [ ] Cache headers verified: `/images/*`, `/_next/image`
- [ ] Compression enabled (Next.js default `compress: true`)
- [ ] Git tag `v1.0.0` created and pushed

---

## Phase I — Smoke Tests (Post-Deploy)

### Storefront
- [ ] Homepage loads, hero image visible
- [ ] `/products` — catalog renders
- [ ] `/products/[slug]` — PDP with images and add-to-cart
- [ ] `/search?q=hamper` — results render
- [ ] Add to cart → `/cart` → `/checkout`
- [ ] COD order completes end-to-end
- [ ] Razorpay test/live payment completes
- [ ] `/account` — login, view orders
- [ ] `/trust-center` loads
- [ ] `/community` loads
- [ ] CMS page e.g. `/about` loads

### Admin
- [ ] `/admin/login` — authenticate
- [ ] `/admin` dashboard loads
- [ ] `/admin/products` — list + edit
- [ ] `/admin/orders` — view order from smoke test
- [ ] `/admin/customers` — list
- [ ] `/admin/operations/deployment` — all green or documented warnings
- [ ] `/admin/operations/integrations` — email test pass

### API
- [ ] `GET /api/health` → `{ "status": "ok" }`
- [ ] No console errors on homepage (browser devtools)
- [ ] No React hydration warnings in console

---

## Phase J — Launch Day

- [ ] Rollback plan reviewed (`docs/PRODUCTION_ROLLBACK_PLAN.md`)
- [ ] Monitoring plan active (`docs/PRODUCTION_MONITORING_PLAN.md`)
- [ ] On-call contact assigned
- [ ] Announce launch internally
- [ ] Monitor Sentry + health for first 2 hours
- [ ] Run Lighthouse on production URL within 24h

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering | | | |
| DevOps | | | |
| Product | | | |
| QA | | | |

**Launch authorized:** ☐ Yes ☐ Conditional ☐ No
