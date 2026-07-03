# Phase 9.9 — Production Integrations

## Completed wiring

### Razorpay webhooks
- HMAC SHA256 verification via `X-Razorpay-Signature` on raw request body
- Secret: `RAZORPAY_WEBHOOK_SECRET` or gateway `webhook_secret_encrypted` in admin
- Replay protection via `X-Razorpay-Event-Id` deduplication in `payment_logs`
- Invalid signatures return **401** (not stored)
- Duplicate events return **200** (retry-safe idempotency)

### Delhivery
- Production base URL default: `https://track.delhivery.com`
- Webhook fail-closed in production without `DELHIVERY_WEBHOOK_SECRET`
- Health probe: `checkDelhiveryHealth()` (serviceability + config validation)
- Structured logging on webhook failures

### Email
- Resend preferred (`EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`)
- SMTP fallback (`EMAIL_PROVIDER=smtp`)
- Admin test: `/admin/operations/integrations`

### Analytics
- GA4, Meta Pixel, Microsoft Clarity via env-driven scripts
- Search Console verification meta (`NEXT_PUBLIC_GSC_VERIFICATION`)
- Events: `page_view`, `begin_checkout`, `purchase` (checkout wired)
- Page views on App Router navigation

### Sentry
- `@sentry/nextjs` installed
- Config: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Enable with `SENTRY_DSN`; optional `SENTRY_RELEASE`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`
- Source maps via `withSentryConfig` when DSN set

### Production readiness
- Report: `generateProductionReadinessReport()` in `src/lib/operations/readiness.ts`
- UI: `/admin/operations/deployment`

## Required env vars for launch

See `.env.example` — minimum:
- `NEXT_PUBLIC_APP_URL` (HTTPS)
- `SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `DELHIVERY_API_KEY`, `DELHIVERY_BASE_URL`, `DELHIVERY_WEBHOOK_SECRET`
- `EMAIL_PROVIDER`, `RESEND_API_KEY` (or SMTP vars), `EMAIL_FROM`
- `CRON_SECRET`
- `SENTRY_DSN`
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (and optional Meta/Clarity)

## Webhook URLs

- Razorpay: `{APP_URL}/api/webhooks/payments/{gateway_uuid}`
- Delhivery: `{APP_URL}/api/webhooks/delhivery`

## Validation

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Tests: `tests/unit/production-integrations.test.ts`
