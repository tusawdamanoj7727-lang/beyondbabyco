# Developer Guide

## Prerequisites

- Node.js 20+
- Supabase project with migrations applied
- `.env.local` from `.env.example`

## Local development

```bash
npm ci
npm run dev
```

## Code conventions

- **Server-only data** — `import "server-only"` in `src/lib/admin/*.ts`
- **Actions** — `"use server"` in `*-actions.ts`, audit via `log_audit` RPC
- **Permissions** — guard pages with `requirePermission()`, actions with matching permission
- **No business logic in Phase 5.0 infra** — security/observability only in `src/lib/security` and `src/lib/observability`

## Testing

```bash
npm run test              # Vitest
npm run test:coverage     # With coverage report
npm run test:e2e          # Playwright (starts dev server)
```

## Performance audit

- **Bundle analysis** — set `ANALYZE=true npm run build` (add `@next/bundle-analyzer` when needed)
- **Code splitting** — admin routes are automatically split by Next.js App Router
- **Dynamic imports** — heavy client components already route-level split
- **Images** — `next.config.ts` AVIF/WebP + remote Supabase patterns
- **Memoization** — audit client components with React DevTools Profiler; no blanket changes in Phase 5.0

See [PERFORMANCE_AUDIT.md](./PERFORMANCE_AUDIT.md).

## Database

- Migrations: `supabase/database/NNN_*.sql`
- Validate: `npm run validate:migrations`
- Types: `src/lib/supabase/database.types.ts` (manual sync with schema)

## Adding a new admin module

1. Migration (if new tables)
2. `src/lib/admin/{module}-types.ts`, `{module}.ts`, `{module}-actions.ts`
3. `src/app/admin/(protected)/{module}/`
4. Update `permissions.ts`, `nav.ts`, `database.types.ts`
