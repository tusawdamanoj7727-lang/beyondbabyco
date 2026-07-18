# Deployment Guide

## Vercel (recommended)

1. Import repository in Vercel dashboard
2. Framework preset: **Next.js**
3. Add environment variables (see [PHASE_25C_OPERATIONS_RUNBOOK.md](./PHASE_25C_OPERATIONS_RUNBOOK.md))
4. Deploy — build command: `npm run build`
5. Verify public health: `curl -sS https://beyondbabyco.in/api/health`
6. Verify detailed health (ops):  
   `curl -sS -H "Authorization: Bearer $CRON_SECRET" https://beyondbabyco.in/api/health`

### Cron note (Hobby vs Pro)

- **Hobby:** Vercel crons are limited to **once per day**. Sub-daily ops jobs must use GitHub Actions (`.github/workflows/ops-crons.yml`) with secrets `CRON_SECRET` and `SITE_URL`.
- **Pro:** You may restore sub-daily schedules in `vercel.json` if desired.

## Docker

```bash
export DOCKER_BUILD=1
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -t beyondbabyco .

docker run -p 3000:3000 --env-file .env.local beyondbabyco
```

Or: `docker compose up --build`

## Supabase migrations

Apply in numeric order via Supabase SQL editor or CLI:

```bash
# Using Supabase CLI (if configured)
supabase db push
```

Manual: run each file in `supabase/database/` in filename order (`001` … `058+`).

See [database/PHASE_25C_QUALITY.md](./database/PHASE_25C_QUALITY.md) before applying cleanup SQL.

## Rollback

See [database/ROLLBACK.md](./database/ROLLBACK.md) — forward-fix preferred; no auto-down migrations.
Also [PRODUCTION_ROLLBACK_PLAN.md](./PRODUCTION_ROLLBACK_PLAN.md).

## CI/CD

GitHub Actions workflow `.github/workflows/ci.yml` runs on every PR:

- Lint, typecheck, tests, build
- Migration validation
- E2E smoke tests
- Docker build on main push

Ops crons: `.github/workflows/ops-crons.yml` (schedule + `workflow_dispatch`).
