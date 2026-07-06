# BeyondBabyCo Deployment

## Primary: Vercel

- **Production URL:** [beyondbabyco.in](https://beyondbabyco.in)
- **Deploy:** Auto-deploys on push to the `main` branch (connect repo in Vercel Dashboard)
- **Environment variables:** Vercel Dashboard → Project → **Settings** → **Environment Variables**
- **Domain:** `beyondbabyco.in` → Vercel project → **Settings** → **Domains**
- **Build command:** `npm run build` (default)
- **Output:** Vercel manages the Next.js output format automatically (no `output: 'standalone'` in `next.config.ts`)

`Dockerfile` and `docker-compose.yml` remain in the repo for optional future self-hosting. They are **not** used by Vercel.

---

## Secondary: Docker (future self-hosting)

For a VPS or private server, use the files in the repo root:

1. Copy `.env.example` → `.env.local` and fill production values.
2. **Before building:** set `output: 'standalone'` in `next.config.ts` (required for the current `Dockerfile`), or restore a `DOCKER_BUILD=1` conditional.
3. Build and run:

```bash
DOCKER_BUILD=1 npm run build
docker compose up --build
```

Health check: `GET /api/health`

---

## Required environment variables (production)

Set these in **Vercel** (and in `.env.local` for local Docker builds):

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://beyondbabyco.in` |
| `NEXT_PUBLIC_APP_URL` | `https://beyondbabyco.in` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never expose to client |
| `RAZORPAY_KEY_ID` | Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | Server-only |
| `SENTRY_DSN` | Error tracking (optional but recommended) |

### Recommended for production

| Variable | Notes |
|----------|--------|
| `RAZORPAY_WEBHOOK_SECRET` | Payment webhooks |
| `CRON_SECRET` | `/api/cron/*` routes |
| `DELHIVERY_API_KEY` | Shipping |
| `DELHIVERY_BASE_URL` | Delhivery API base |
| `SENTRY_ORG` | Source maps upload on Vercel |
| `SENTRY_PROJECT` | e.g. `beyondbabyco` |
| `SENTRY_AUTH_TOKEN` | CI / Vercel build plugin |

See `.env.example` for the full list (email, analytics, Delhivery, etc.).

---

## Supabase auth redirects

In Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL:** `https://beyondbabyco.in`
- **Redirect URLs:** `https://beyondbabyco.in/auth/callback` and `https://beyondbabyco.in/auth/callback?*`

---

## Database migrations

SQL migrations live in `supabase/database/`. Apply new files manually in the **Supabase SQL Editor** (or use `npm run db:push` when linked via Supabase CLI).

---

## Quick checklist (new production deploy)

1. Push to `main` → Vercel builds and deploys
2. Confirm env vars in Vercel match `.env.example`
3. Run pending SQL migrations in Supabase
4. Verify `https://beyondbabyco.in/api/health`
5. Smoke-test checkout (Razorpay test mode first, then live keys)
