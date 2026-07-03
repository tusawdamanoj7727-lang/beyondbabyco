# BeyondBabyCo — Launch Day Checklist

**Version:** 1.0.0  
**Date:** 2026-07-01  
**Use this checklist on the day you route public traffic to production.**

---

## T-24 Hours — Pre-Launch

### Environment
- [ ] `NEXT_PUBLIC_APP_URL` = `https://beyondbabyco.com` (or your domain) with valid SSL
- [ ] Supabase URL + anon key + service role key set
- [ ] `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (live mode)
- [ ] `DELHIVERY_API_KEY`, `DELHIVERY_BASE_URL=https://track.delhivery.com`, `DELHIVERY_WEBHOOK_SECRET`
- [ ] `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` verified domain
- [ ] `CRON_SECRET` (64+ random chars) set
- [ ] `SENTRY_DSN` set
- [ ] `NEXT_PUBLIC_GA4_MEASUREMENT_ID` set (optional but recommended)
- [ ] `AI_DEV_ENABLED` is **NOT** set or is `false`

### Supabase Dashboard
- [ ] OAuth providers enabled (Google, Apple, Facebook if used)
- [ ] Redirect URLs include `{APP_URL}/auth/callback`
- [ ] RLS policies applied (`APPLY_ALL.sql` or migrations synced)
- [ ] Storage buckets configured (products, media)

### Webhooks (External Dashboards)
- [ ] Razorpay webhook → `https://{domain}/api/webhooks/payments/{gatewayId}`
- [ ] Delhivery webhook → `https://{domain}/api/webhooks/delhivery`
- [ ] Test webhook delivery from each provider dashboard

### Cron
- [ ] External scheduler hits `GET https://{domain}/api/cron/sync-shipments` hourly
- [ ] Header: `Authorization: Bearer {CRON_SECRET}`
- [ ] Verify 401 without token, 200 with token

---

## T-4 Hours — Content & Catalog

### Homepage CMS (`/admin/homepage`)
- [ ] Status = **Published**
- [ ] Hero slides reviewed
- [ ] Featured products accurate (launch catalog)
- [ ] Testimonials are real or intentionally empty (no fake stats)
- [ ] Preview store (`/` in new tab) looks correct

### Products (`/admin/products`)
- [ ] Live product has correct price, inventory, images
- [ ] Coming-soon products show Notify Me (not Add to Cart)
- [ ] SEO titles and descriptions set on live SKUs

### Legal & Trust
- [ ] Privacy policy, terms, shipping, returns pages live
- [ ] Trust Center content accurate
- [ ] Contact/support email monitored

---

## T-1 Hour — Automated Smoke

Run locally or against staging/production URL:

```bash
npm run lint
npm run typecheck
npm run test
PLAYWRIGHT_BASE_URL=https://your-domain.com npm run test:e2e
```

Manual API checks:

```bash
curl -s https://your-domain.com/api/health | jq .
curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/api/cron/sync-shipments
# Expect 401 without auth

curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/sync-shipments
# Expect 200
```

Admin ops check:
- [ ] Visit `/admin/operations/deployment` — no P0 blockers shown
- [ ] Visit `/admin/operations/integrations` — email, Delhivery, analytics green or expected warnings

---

## T-0 — Go Live

- [ ] Deploy production build (`npm run build` verified in CI)
- [ ] DNS pointed to production host
- [ ] SSL certificate active
- [ ] Remove any maintenance mode
- [ ] Submit sitemap to Google Search Console: `https://{domain}/sitemap.xml`

---

## Launch Hour — Manual QA (Human)

### Storefront
- [ ] Homepage loads; no console errors
- [ ] Search returns products
- [ ] PLP filters and sort work
- [ ] PDP: gallery, add to cart, notify me (coming soon)
- [ ] Cart updates quantities
- [ ] Wishlist add/remove
- [ ] Login / register / OAuth
- [ ] Checkout: address, coupon, COD path
- [ ] Checkout: Razorpay test ₹1 live transaction (then refund if test)
- [ ] Order confirmation email received
- [ ] Account order history shows new order

### Admin
- [ ] Admin login works
- [ ] Dashboard shows live stats
- [ ] ⌘K search finds a product
- [ ] New order appears in `/admin/orders`
- [ ] Media library upload works

---

## T+1 Hour — Monitor

- [ ] Sentry: no error spike
- [ ] `/api/health` returns ok
- [ ] Razorpay dashboard: payment captured
- [ ] Delhivery: shipment created (if auto-fulfillment enabled)
- [ ] Email queue: no stuck failures in admin communications

---

## Rollback Checklist (If Needed)

1. [ ] Revert to previous deployment in hosting dashboard
2. [ ] Disable Razorpay live keys if payment issue
3. [ ] Post incident note in ops channel
4. [ ] Follow `docs/PRODUCTION_ROLLBACK_PLAN.md`

---

## Backup Checklist

- [ ] Supabase daily backup enabled (Pro plan or manual export)
- [ ] Export critical tables before major launch: products, orders, homepage_settings
- [ ] Document current git commit SHA deployed: `_______________`
- [ ] Store copy of `.env` secrets in team password manager (not git)

---

## Monitoring Checklist (First 7 Days)

| Signal | Where | Alert threshold |
|--------|-------|-----------------|
| 5xx errors | Sentry | > 10/hour |
| Health probe | Uptime monitor on `/api/health` | Down 2 min |
| Payment failures | Razorpay dashboard | > 5% failure rate |
| Email queue | `/admin/communications` | Stuck > 1 hour |
| Cron sync | Cron logs | Missing hourly run |
| Core Web Vitals | GA4 / PageSpeed | LCP > 4s sustained |

---

## Incident Response

1. **Identify** — Sentry alert or customer report
2. **Triage** — P0 (checkout down) vs P1 (cosmetic)
3. **Communicate** — Status update within 30 min for P0
4. **Fix or rollback** — See rollback checklist
5. **Post-mortem** — Within 48h for any P0

Contacts:
- Engineering lead: _______________
- Operations: _______________
- Razorpay support: dashboard
- Delhivery support: account manager

---

## Sign-Off

| Checkpoint | Name | Time | ✓ |
|------------|------|------|---|
| Env configured | | | |
| Smoke tests pass | | | |
| Content published | | | |
| Go live | | | |
| T+1h monitoring clear | | | |

**Reference:** `docs/FINAL_GO_LIVE_CERTIFICATE.md` · `docs/PRODUCTION_SIGNOFF.md`
