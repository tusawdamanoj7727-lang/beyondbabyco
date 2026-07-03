# BeyondBabyCo — Enterprise Admin Platform

Next.js 15 + Supabase admin and storefront for Beyond Baby Co.

## Quick start

```bash
cp .env.example .env.local
# Fill in Supabase URL and anon key

npm ci
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Vitest unit + integration |
| `npm run test:e2e` | Playwright E2E |
| `npm run validate:migrations` | SQL migration audit |

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Deployment

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) and [docs/PRODUCTION_CHECKLIST.md](./docs/PRODUCTION_CHECKLIST.md).

## Docker

```bash
docker compose up --build
```

## Health

- `GET /api/health` — aggregate status
- `GET /api/health/database` — Supabase DB
- `GET /api/health/storage` — Supabase Storage
- `GET /api/health/queue` — marketing queues
- `GET /api/health/memory` — process memory

## Security

CSP, HSTS (production), rate limiting, and CSRF validation are applied via middleware and `next.config.ts`. See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md#security).

## Documentation

- [Developer Guide](./docs/DEVELOPER_GUIDE.md)
- [Admin Guide](./docs/ADMIN_GUIDE.md)
- [API Reference](./docs/API.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
- [Database migrations](./supabase/database/README.md)
