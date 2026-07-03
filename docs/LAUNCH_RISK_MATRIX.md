# BeyondBabyCo v1.0.0 — Launch Risk Matrix

**Date:** 2026-07-01  
**Phase:** 10.3 Enterprise Launch Certification

---

## Priority Definitions

| Priority | Definition | Launch impact |
|----------|------------|---------------|
| **P0** | Production blocker — must resolve before public traffic | Blocks launch |
| **P1** | High — significant customer or revenue impact if unresolved | Launch with mitigation plan |
| **P2** | Medium — degraded experience or ops burden | Accept with monitoring |
| **P3** | Low — cosmetic, minor, or post-launch improvement | Backlog |

---

## Risk Register

| ID | Priority | Risk | Impact | Likelihood | Mitigation | Owner |
|----|----------|------|--------|------------|------------|-------|
| R-001 | **P0** | Razorpay credentials not set in production env | Online payments fail; checkout broken for card/UPI | High if unset | Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`; verify webhook URL in Razorpay Dashboard | DevOps |
| R-002 | **P0** | Email provider not configured | Order confirmations, password resets, transactional comms fail | High if unset | Set `EMAIL_PROVIDER=resend` + `RESEND_API_KEY` + `EMAIL_FROM`; test from `/admin/operations/integrations` | DevOps |
| R-003 | **P0** | `NEXT_PUBLIC_APP_URL` not HTTPS production domain | CSRF failures, wrong webhook URLs, broken redirects | High if localhost | Set to `https://beyondbabyco.com` (or prod domain) before deploy | DevOps |
| R-004 | **P1** | Sentry not configured | Undetected runtime errors in production | Medium | Set `SENTRY_DSN`; verify test error in Sentry dashboard | DevOps |
| R-005 | **P1** | GA4 / analytics not configured | No conversion or traffic visibility | Medium | Set `NEXT_PUBLIC_GA4_MEASUREMENT_ID`; verify realtime events | Marketing |
| R-006 | **P1** | Cron job not scheduled | Shipment tracking stale; Delhivery sync delayed | Medium | Schedule `GET /api/cron/sync-shipments` every 15–30 min with `CRON_SECRET` | DevOps |
| R-007 | **P1** | Delhivery webhook URL not registered | Tracking updates delayed until cron | Medium | Register `{APP_URL}/api/webhooks/delhivery` in Delhivery dashboard | Ops |
| R-008 | **P1** | Mobile Lighthouse Performance below 95 on local SSR | Slower mobile UX until edge deploy | High (local) / Low (Vercel) | Deploy to Vercel/edge; enable Supabase Storage CDN | DevOps |
| R-009 | **P2** | Accessibility scores 93–97 (not 100) | Minor a11y gaps for some users | Low | Post-launch contrast pass on muted marketing text | Design |
| R-010 | **P2** | No automated deploy workflow in CI | Manual deploy errors possible | Medium | Document deploy runbook; add CI deploy post-freeze | DevOps |
| R-011 | **P2** | Admin login SEO score 58 (noindex) | Admin URL not indexed — intentional | N/A | Keep `robots: noindex` on admin login | Security |
| R-012 | **P2** | Full checkout/payment E2E not in CI | Payment regressions caught late | Low | Manual staging smoke before launch | QA |
| R-013 | **P2** | Supabase PITR not enabled (free tier) | Longer RPO on data loss | Low | Upgrade to Pro for PITR before scale | DevOps |
| R-014 | **P3** | ESLint warnings (16, scripts + adapters) | No runtime impact | N/A | Clean up post-launch | Engineering |
| R-015 | **P3** | OG images not on all landing pages | Suboptimal social sharing | Low | Add og:image assets per route | Marketing |
| R-016 | **P3** | AI dev routes exist (`/dev/ai`) | Exposure if `AI_DEV_ENABLED=true` in prod | Very low | Ensure `AI_DEV_ENABLED` absent/false in production | DevOps |
| R-017 | **P3** | Turbopack `next start` manifest issue | Local prod server instability | Low | Use webpack build for Docker; Vercel handles deploy | Engineering |

---

## Summary by Priority

| Priority | Count | Launch gate |
|----------|-------|-------------|
| P0 | 3 | **Must resolve** before public launch |
| P1 | 5 | Strongly recommended; mitigations documented |
| P2 | 5 | Accept with monitoring |
| P3 | 4 | Post-launch backlog |

---

## P0 Resolution Checklist

- [ ] R-001: Razorpay env vars + webhook registered
- [ ] R-002: Email provider configured and test send succeeds
- [ ] R-003: Production HTTPS URL set and verified

**Until all P0 items are resolved: launch status remains Conditional Go.**
