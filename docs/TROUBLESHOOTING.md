# Troubleshooting

## Build fails: missing env vars

Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set (CI uses placeholders).

## Admin redirect loop

- Clear cookies for localhost
- Verify Supabase auth redirect URLs include your domain
- Check middleware only runs on `/admin/*`

## Health check degraded

| Check | Fix |
|-------|-----|
| database | Verify Supabase URL/key; run migrations |
| storage | Ensure storage buckets exist (`004_storage.sql`) |
| queues | Apply `021_marketing_automation.sql` |
| environment | Set production secrets per checklist |

## 429 Too Many Requests

Rate limit exceeded. Wait for `Retry-After` seconds or reduce request frequency.

## CSRF 403 on API

Ensure requests include matching `Origin` or `Referer` header. Webhooks and health endpoints are exempt.

## Docker build fails

Set `DOCKER_BUILD=1` for standalone output. Pass build-args for Supabase public keys.

## Tests fail

```bash
npm ci
npm run test
```

E2E requires port 3000 free. Use `PLAYWRIGHT_BASE_URL` for remote targets.
