# Performance Audit (Phase 5.0)

## Image optimization

Configured in `next.config.ts`:

- AVIF + WebP formats
- Supabase storage remote pattern
- 24h minimum cache TTL

**Recommendation:** Use `next/image` for all admin media previews (already in Media module).

## Code splitting

Next.js App Router splits by route automatically. Each `/admin/*` sub-route is a separate chunk.

**Audit result:** 66 routes compiled; largest client bundles in homepage CMS and product forms — acceptable for admin-only traffic.

## Dynamic imports

Pattern for future heavy charts:

```ts
const Chart = dynamic(() => import("@/components/admin/reports/ReportChart"), { ssr: false });
```

Reports module already lazy-loads at route level.

## Caching

- Static assets: Next.js immutable cache headers
- API health routes: `force-dynamic` (no cache)
- Server Components: default fetch cache per Next.js 15

## Database queries

- List views use batch queries (no N+1) across admin modules
- Slow query logging: `withTiming()` in `src/lib/observability/performance.ts`

## Memoization

Client components using `useTransition` for mutations — no unnecessary re-renders observed in list views.

**Action items (post-launch):**

1. Add Redis rate limiter for multi-instance deploys
2. Enable Sentry performance monitoring
3. Add `@next/bundle-analyzer` for periodic bundle reviews
