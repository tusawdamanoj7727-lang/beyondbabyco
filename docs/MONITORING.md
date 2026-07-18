# Production Monitoring — BeyondBabyCo

Live site: **https://beyondbabyco.in**

## Stack

| Service | Purpose | Setup |
|---------|---------|--------|
| **Sentry** | Error tracking, release tracking, cron monitors | Vercel env + Sentry project |
| **Vercel Analytics** | Page views, funnels | `@vercel/analytics` (auto on Vercel) |
| **Vercel Speed Insights** | Web Vitals / performance | `@vercel/speed-insights` (auto on Vercel) |
| **Better Stack Uptime** | External uptime on `/api/health` | Monitor URL in Better Stack dashboard |
| **Better Stack Logs** | Optional log/error forwarding | `BETTER_STACK_DSN` |

## Operational error domains

Sentry events are tagged with `domain` for filtering:

| Domain | Captured from |
|--------|----------------|
| `checkout` | Checkout client, `placeCheckoutOrderAction` |
| `razorpay` | `verify-payment`, Razorpay checkout completion |
| `coupon` | `/api/coupons/validate` |
| `inventory` | `/api/inventory/*`, reservation errors |
| `email` | SMTP send failures after retries |
| `webhook` | Razorpay + Delhivery webhook rejections |
| `cron` | `/api/cron/*` failures |

## Release tracking

- Release ID = `SENTRY_RELEASE` or `VERCEL_GIT_COMMIT_SHA`
- Exposed on `GET /api/health` as `release` field and headers:
  - `x-beyondbabyco-release`
  - `sentry-release`

Verify after deploy:

```bash
curl -sI https://beyondbabyco.in/api/health | grep -i release
curl -s https://beyondbabyco.in/api/health | jq .data.release
```

## Better Stack uptime

1. Create monitor: `GET https://beyondbabyco.in/api/health` — expect 200, interval 1 min
2. Optional heartbeat: set `BETTER_STACK_HEARTBEAT_URL` — pinged when health is `ok`

## Vercel dashboard

Enable **Web Analytics** and **Speed Insights** in Project → Analytics (packages already wired in `AnalyticsRoot`).
