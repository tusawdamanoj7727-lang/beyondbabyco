# Deployment Guide

## Vercel (recommended)

1. Import repository in Vercel dashboard
2. Framework preset: **Next.js**
3. Add environment variables from `.env.example`
4. Deploy — build command: `npm run build`
5. Verify: `curl $URL/api/health`

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

Manual: run each file in `supabase/database/` from `001` to `021`.

## Rollback

See [database/ROLLBACK.md](./database/ROLLBACK.md) — forward-fix preferred; no auto-down migrations.

## CI/CD

GitHub Actions workflow `.github/workflows/ci.yml` runs on every PR:

- Lint, typecheck, tests, build
- Migration validation
- E2E smoke tests
- Docker build on main push
