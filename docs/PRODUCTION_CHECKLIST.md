# Production Checklist

## Vercel

- [ ] Connect GitHub repository
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (encrypted)
- [ ] Enable automatic HTTPS
- [ ] Configure preview deployments for PRs
- [ ] Add health check monitor → `GET /api/health`

## Supabase

- [ ] Apply all migrations (`001` through `021`) in order
- [ ] Enable RLS on all tables (verify in dashboard)
- [ ] Rotate service role key if leaked
- [ ] Configure daily backups (Pro plan)
- [ ] Set auth redirect URLs for production domain
- [ ] Review storage bucket policies

## Domain & CDN

- [ ] DNS A/CNAME to Vercel
- [ ] SSL certificate active
- [ ] Supabase storage CDN for public buckets
- [ ] Cache headers for static assets (Next.js default)

## Environment variables

| Variable | Required | Scope |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public |
| `NEXT_PUBLIC_APP_URL` | Prod recommended | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod recommended | Server |
| `SENTRY_DSN` | Optional | Server |
| `CRON_SECRET` | Optional | Server |

## Pre-launch validation

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run validate:migrations
curl https://your-domain.com/api/health
```

## Post-launch

- [ ] Monitor `/api/health` uptime
- [ ] Review audit logs weekly
- [ ] Test backup restore quarterly (see `docs/database/BACKUP_STRATEGY.md`)
