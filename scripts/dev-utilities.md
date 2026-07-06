# Dev utilities (removed from package.json)

These commands were removed from `package.json` to keep the root scripts minimal. Run them directly with `node`, `bash`, or `npm run` is no longer required.

> **Note:** Script files remain in `scripts/` — only the npm aliases were removed.

---

## Testing (removed aliases)

| Former script | Full command | Purpose |
|---------------|--------------|---------|
| `test:watch` | `vitest` | Run Vitest in watch mode (interactive re-run on file changes). |
| `test:coverage` | `vitest run --coverage` | Run unit tests once with V8 coverage report. |

---

## Image pipeline

| Former script | Full command | Purpose |
|---------------|--------------|---------|
| `image:audit` | `node scripts/image-pipeline-audit.mjs` | Audit product/static image usage, missing variants, and optimization gaps. |
| `image:optimize-static` | `node scripts/optimize-static-images.mjs` | Compress and resize static assets under `public/`. |
| `image:backfill-products` | `node scripts/backfill-product-image-variants.mjs` | Generate missing WebP/size variants for product images in the media library. |

---

## Audits & certification

| Former script | Full command | Purpose |
|---------------|--------------|---------|
| `lighthouse:cert` | `node scripts/lighthouse-certification.mjs` | Run Lighthouse checks and write a certification report. |
| `journey:audit` | `node scripts/customer-journey-audit.mjs` | Scan storefront routes, CTAs, and trust paths for broken links or gaps. |
| `phase-13:audit` | `node scripts/phase-13-audit.mjs` | Phase 13 QA audit: routes, TODOs, console.log usage, asset coverage. |
| `production-deployment-audit` | `node scripts/production-deployment-audit.mjs` | Pre-deploy checklist (env, auth, payments, Delhivery, migrations). *Never had an npm alias.* |

---

## Database & migrations

| Former script | Full command | Purpose |
|---------------|--------------|---------|
| `validate:migrations` | `node scripts/validate-migrations.mjs` | Lint SQL migration files for ordering, idempotency, and common mistakes. |
| `audit:database` | `node scripts/audit-database-schema.mjs` | Compare live Postgres schema to expected migration state. |
| `sync:database` | `node scripts/sync-database.mjs` | Sync schema drift report and suggest repair SQL. |
| `migrate:safe` | `node scripts/run-migrations-safe.mjs` | Apply pending migrations with checkpoints and rollback on failure. |
| `repair:database` | `node scripts/repair-database.mjs` | Run repair SQL against the linked database. |
| `db:combine` | `node scripts/combine-migrations.mjs` | Concatenate `supabase/database/*.sql` into a single file for manual runs. |
| `db:types` | `node scripts/gen-supabase-types.mjs` | Regenerate `src/lib/supabase/database.types.ts` via postgres-meta or Supabase CLI (uses `DATABASE_URL` from `.env.local`). Preferred over `db:generate-types` when Docker/CLI is unavailable. |

---

## Admin & auth diagnostics

| Former script | Full command | Purpose |
|---------------|--------------|---------|
| `check:admin` | `node scripts/check-admin-setup.mjs` | Verify admin user, roles, and RLS for the admin panel. |
| `check:auth` | `node scripts/check-auth-config.mjs` | Validate Supabase auth URLs, redirect URLs, and env vars. |
| `bootstrap:admin` | `node scripts/bootstrap-admin.mjs` | Create the first admin user and grant admin role. |
| `repair:auth-rpcs` | `node scripts/ensure-auth-rpcs.mjs` | Ensure auth helper RPCs exist in Postgres. |
| `debug:admin` | `node scripts/debug-admin-data.mjs` | Dump admin-visible counts and sample rows for debugging. |

---

## Cron & build analysis

| Former script | Full command | Purpose |
|---------------|--------------|---------|
| `cron:sync-shipments` | `node -e "fetch(process.env.NEXT_PUBLIC_APP_URL+'/api/cron/sync-shipments',{headers:{Authorization:'Bearer '+process.env.CRON_SECRET}}).then(r=>r.json()).then(console.log)"` | Manually trigger the shipment sync cron endpoint (requires `NEXT_PUBLIC_APP_URL` and `CRON_SECRET`). |
| `analyze` | `ANALYZE=true next build --turbopack` | Production build with `@next/bundle-analyzer` (when configured). |

---

## ComfyUI / local AI

| Former script | Full command | Purpose |
|---------------|--------------|---------|
| `ai:install` | `bash tools/comfyui/scripts/install.sh` | Install ComfyUI and dependencies locally. |
| `ai:models` | `bash tools/comfyui/scripts/download-models.sh` | Download FLUX/checkpoint models for ComfyUI. |
| `ai:start` | `bash tools/comfyui/scripts/start.sh` | Start the ComfyUI server. |
| `ai:stop` | `bash tools/comfyui/scripts/stop.sh` | Stop the ComfyUI server. |
| `ai:health` | `node scripts/ai-health.mjs` | Ping ComfyUI and report model/workflow readiness. |
| `ai:generate` | `node scripts/ai-generate.mjs` | Run a single ComfyUI generation job from the CLI. |

Additional helper (no npm alias): `bash tools/comfyui/scripts/status.sh` — check if ComfyUI is running.

Python helper: `python scripts/download-flux-models.py` — alternate model download script.

---

## Brand & OG assets

| Former script | Full command | Purpose |
|---------------|--------------|---------|
| `hero:finalize` | `node scripts/hero-phase-8-1-finalize.mjs` | Finalize Phase 8.1 hero assets and manifest. |
| `brand:sync-real` | `node scripts/sync-real-photography.mjs` | Import/sync real photography into the asset catalog. |
| `brand:assets` | `node scripts/sync-real-photography.mjs && node scripts/build-brand-assets.mjs && node scripts/assets/convert-png-only-webp.mjs` | Full brand asset pipeline: sync photos, build assets, convert PNG→WebP. |
| `brand:icons` | `node scripts/build-brand-assets.mjs` | Build favicon/PWA icon set from brand logo. |
| `brand:audit` | `node scripts/brand-assets-audit.mjs` | Audit brand folder for legacy placeholders and missing files. |
| `og:generate` | `node scripts/generate-og-images.mjs` | Generate Open Graph images under `public/images/og/`. |

Deprecated wrapper (removed): `node scripts/generate-brand-icons.mjs` → use `node scripts/build-brand-logo.mjs` instead.

---

## Homepage & catalog phases (8.x)

| Former script | Full command | Purpose |
|---------------|--------------|---------|
| `homepage:phase-8-2` | `node scripts/homepage-phase-8-2-pipeline.mjs` | Generate homepage lifestyle/hero assets (Phase 8.2). |
| `catalog:phase-8-4` | `node scripts/catalog-phase-8-4-seed.mjs` | Seed catalog media and placeholder mappings (Phase 8.4). |
| `catalog:phase-8-4:verify` | `node scripts/catalog-phase-8-4-verify.mjs` | Verify Phase 8.4 catalog seed results. |
| `products:phase-8-3` | `node scripts/products-phase-8-5a-pipeline.mjs` | Alias → Phase 8.5a product pipeline. |
| `products:phase-8-3:verify` | `node scripts/products-phase-8-3-verify.mjs` | Verify Phase 8.3 product asset assignments. |
| `products:phase-8-5` | `node scripts/products-phase-8-5a-pipeline.mjs --scenes-procedural` | Product shots with procedural scenes. |
| `products:phase-8-5a` | `node scripts/products-phase-8-5a-pipeline.mjs --scenes-procedural` | Phase 8.5a product photography pipeline. |
| `products:phase-8-5a:benchmark` | `node scripts/products-phase-8-5a-pipeline.mjs --benchmark` | Benchmark generation speed/quality. |
| `products:phase-8-5a:batch1` | `node scripts/products-phase-8-5a-pipeline.mjs --batch 1 --scenes-procedural` | Generate batch 1 product assets. |
| `products:phase-8-5a:batch2` | `node scripts/products-phase-8-5a-pipeline.mjs --batch 2 --scenes-procedural` | Generate batch 2 product assets. |
| `products:phase-8-5a:batch3` | `node scripts/products-phase-8-5a-pipeline.mjs --batch 3 --scenes-procedural` | Generate batch 3 product assets. |
| `products:phase-8-6:report` | `node -e "console.log(require('./scripts/data/phase-8-6-report.json'))"` | Print Phase 8.6 report JSON. |

Legacy pipelines (no npm alias, still on disk):

- `node scripts/products-phase-8-3-pipeline.mjs` — original Phase 8.3 ComfyUI product pipeline.
- `node scripts/products-phase-8-5-pipeline.mjs` — Phase 8.5 premium product photography (FLUX).

---

## Master scenes

| Former script | Full command | Purpose |
|---------------|--------------|---------|
| `master-scenes:generate` | `node scripts/master-scenes-generate.mjs --procedural` | Generate master scene backgrounds (procedural). |
| `master-scenes:flux` | `node scripts/master-scenes-generate.mjs --flux` | Generate master scenes via ComfyUI/FLUX. |

---

## Asset generation (procedural & FLUX)

| Former script | Full command | Purpose |
|---------------|--------------|---------|
| `assets:sync-catalog` | `vitest run tests/unit/asset-catalog-export.test.ts` | Export/sync asset catalog via unit test harness. |
| `assets:sync-blurs` | `vitest run tests/unit/generated-asset-blurs-export.test.ts` | Regenerate blur placeholders for generated assets. |
| `assets:generate` | `node scripts/assets/generate.mjs` | Generate assets for a category (see flags). |
| `assets:hero` | `node scripts/assets/generate.mjs --category hero --procedural` | Procedural hero images. |
| `assets:lifestyle` | `node scripts/assets/generate.mjs --category lifestyle --procedural` | Procedural lifestyle images. |
| `assets:products` | `node scripts/assets/generate.mjs --category products --procedural` | Procedural product scene images. |
| `assets:research` | `node scripts/assets/generate.mjs --category research --procedural` | Procedural research section images. |
| `assets:science` | `node scripts/assets/generate.mjs --category science --procedural` | Procedural science section images. |
| `assets:ingredients` | `node scripts/assets/generate.mjs --category ingredients --procedural` | Procedural ingredient images. |
| `assets:timeline` | `node scripts/assets/generate.mjs --category timeline --procedural` | Procedural timeline images. |
| `assets:newsletter` | `node scripts/assets/generate.mjs --category newsletter --procedural` | Procedural newsletter images. |
| `assets:trust` | `node scripts/assets/generate.mjs --category trust --procedural` | Procedural trust-center images. |
| `assets:marketing` | `node scripts/assets/generate.mjs --category marketing --procedural` | Procedural marketing images. |
| `assets:all` | `node scripts/assets/generate.mjs --all --procedural` | All categories, procedural mode. |
| `assets:all:flux` | `node scripts/assets/generate.mjs --all --flux` | All categories via FLUX/ComfyUI. |
| `assets:all:flux:force` | `node scripts/assets/generate.mjs --all --flux --force` | Regenerate all FLUX assets (overwrite). |
| `assets:flux:generate` | `node scripts/assets/flux-generate.mjs --all` | FLUX batch generation for all slots. |
| `assets:flux:generate:hero` | `node scripts/assets/flux-generate.mjs --group hero` | FLUX generation for hero group. |
| `assets:flux:generate:lifestyle` | `node scripts/assets/flux-generate.mjs --category lifestyle` | FLUX lifestyle category. |
| `assets:flux:generate:products` | `node scripts/assets/flux-generate.mjs --category products` | FLUX products category. |
| `assets:flux:score` | `node scripts/assets/flux-score.mjs` | Score FLUX candidates with quality heuristics. |
| `assets:flux:assign` | `node scripts/assets/flux-assign.mjs` | Assign winning FLUX images to catalog slots. |
| `assets:flux:report` | `node scripts/assets/flux-report.mjs` | FLUX assignment coverage report. |
| `assets:flux:prompt-report` | `node scripts/assets/flux-prompt-report.mjs` | Prompt engineering effectiveness report. |
| `assets:reviews:sync` | `node scripts/assets/sync-reviews.mjs` | Sync review portrait assets. |
| `assets:ai-report` | `node scripts/assets/ai-asset-report.mjs` | Summary of AI-generated asset status. |
| `assets:phase-11-5:produce` | `node scripts/assets/phase-11-5-produce.mjs` | Phase 11.5 production workflow (assign existing). |
| `assets:phase-11-5:produce:generate` | `node scripts/assets/phase-11-5-produce.mjs --generate` | Phase 11.5 with new generation. |
| `assets:phase-11-5:report` | `node scripts/assets/phase-11-5-report.mjs` | Phase 11.5 coverage report. |
| `assets:report` | `node scripts/assets/write-report.mjs` | Write consolidated asset pipeline report. |
