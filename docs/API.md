# API Reference

## Health (public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Aggregate health (DB, storage, queues, memory, env) |
| GET | `/api/health/database` | Database connectivity |
| GET | `/api/health/storage` | Storage bucket probe |
| GET | `/api/health/queue` | Marketing queue depths |
| GET | `/api/health/memory` | Process memory usage |
| GET | `/api/health/supabase` | Legacy Supabase probe |

## Admin observability (authenticated)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/admin/audit-logs` | `settings.manage` | Recent audit entries |
| GET | `/api/admin/metrics` | `reports.view` | Performance metrics placeholder |

Query params for audit logs:

- `limit` — max 100, default 50
- `table` — filter by `table_name`

## Webhooks

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhooks/payments/[gatewayId]` | Payment gateway webhooks (CSRF exempt) |

## Response headers

All `/api/*` responses include:

- `x-request-id`
- `x-correlation-id`
- Security headers (CSP, X-Frame-Options, etc.)

## Rate limits

- `/admin/*` — 60 req/min per IP
- `/api/*` — 200 req/min per IP

429 responses include `Retry-After`.
