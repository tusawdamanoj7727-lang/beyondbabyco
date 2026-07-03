# Production Deployment Audit

**Generated:** 2026-07-03  
**Project:** BeyondBabyCo (`beyondbabyco/`)  
**Audit script:** `node scripts/production-deployment-audit.mjs` (read-only, re-runnable)

---

## Executive summary

| Metric | Value |
|--------|-------|
| **Total project size (disk)** | **28.41 GB** |
| **Deployable app source (est.)** | **~49 MB** (src + public excl. generated + supabase) |
| **Production build output (`.next`)** | **~100 MB** |
| **Runtime install (`node_modules`)** | **~594 MB** |
| **Local-only AI stack (`tools/comfyui`)** | **~27.4 GB** — must NOT deploy |

The workspace is dominated by **local ComfyUI models/venv**, not the web app. The Next.js storefront itself is ~50 MB of source assets plus a ~100 MB build artifact.

---

## 1. Folder size breakdown

| Folder | Size | Deploy? | Notes |
|--------|------|---------|-------|
| `node_modules/` | 593.7 MB | CI install only | Excluded via `.gitignore` |
| `.next/` | 99.9 MB | CI build only | Excluded via `.gitignore` |
| `.next/cache/` | 1.8 MB | No | Build cache — safe to delete locally |
| `.git/` | 156 KB | N/A | Tiny — most assets untracked locally |
| `public/` | 281.7 MB | Partial | Static assets served by Next.js/CDN |
| `public/images/generated/` | 236.5 MB | Optional | **Gitignored** — 2,291 local files |
| `public/icons/` | 29.1 MB | Yes | Mascot/icon WebP assets |
| `public/images/real/` | ~5.5 MB | Yes | Production photography |
| `public/images/hero/` | ~5.5 MB | Yes | Hero WebP set |
| `public/images/homepage/` | ~3.5 MB | Yes | Homepage assets |
| `public/images/products/` | ~2.2 MB | Yes | Product packaging variants |
| `public/images/brand/` | ~2.1 MB | Yes | Logos, favicons |
| `scripts/` | 1.5 MB | No | Dev/CI tooling only |
| `scripts/assets/` | 984 KB | No | Asset pipeline configs |
| `src/` | 3.3 MB | Yes | Application code |
| `supabase/` | ~368 KB | Migrations only | SQL — not bundled in Next output |
| `tests/` | ~104 KB | No | Vitest/Playwright |
| `coverage/` | 3.8 KB | No | Test output |
| `tools/comfyui/models/` | 25.7 GB | **Never** | `.gitignore` + local AI only |
| `tools/comfyui/venv/` | ~1.8 GB | **Never** | Python virtualenv |
| `tools/comfyui/ComfyUI/` | ~59 MB | **Never** | ComfyUI runtime |
| `uploads/` | — | N/A | **Does not exist** in project |

### Cache folders detected

| Path | Size | Action |
|------|------|--------|
| `.next/cache/` | 1.8 MB | Safe to delete — regenerated on `npm run build` |
| `coverage/` | 3.8 KB | Safe to delete — regenerated on `npm run test:coverage` |
| `.next/cache/eslint/` | (inside above) | ESLint cache |

No `.turbo/`, `.vitest/`, or `.cache/` directories found at project root.

---

## 2. Deployable size estimate

### What ships to a typical Vercel/Node host

```
npm ci                    →  node_modules (~594 MB on disk, not in git)
npm run build             →  .next/ (~100 MB)
public/ (tracked assets)  →  served as static files
src/                        →  compiled into .next (not copied raw)
```

| Layer | Estimated size |
|-------|----------------|
| Git repository (current) | ~256 KB tracked objects — **only 5 files under `public/` tracked** |
| `public/` without `generated/` | ~45 MB |
| `src/` + config | ~4 MB |
| Built `.next/` (server + static) | ~110 MB (105 MB server + 5 MB static chunks) |
| **Typical CI artifact** | **~150–700 MB** depending on whether `node_modules` is cached |

> **Important:** `public/images/generated/**` is gitignored. Production must either commit curated assets, sync from object storage, or run the asset pipeline in CI. Local disk has 236 MB / 2,291 generated files that are **not** in git today.

---

## 3. Largest 100 files (summary)

All top entries are under `public/images/generated/` (PNG, 1.0–2.6 MB each) or `public/icons/` (mascot WebP ~1.1–1.2 MB).

**Top 10:**

| Size | Path |
|------|------|
| 2.6 MB | `public/images/generated/hero/collection-hero.png` |
| 2.6 MB | `public/images/generated/hero/phase-8-1/hero-background/hero-background-02.png` |
| 2.4 MB | `public/images/generated/lifestyle/baby-sleeping.png` |
| 2.3 MB | `public/images/generated/hero/science-backed-hero.png` |
| 2.3 MB | `public/images/generated/hero/phase-8-1/mother-baby/mother-baby-19.png` |
| 2.3 MB | `public/images/generated/hero/phase-8-1/hero-background/hero-background-06.png` |
| 2.2 MB | `public/images/generated/lifestyle/family.png` |
| 2.2 MB | `public/images/generated/hero/family-morning-hero.png` |
| 2.2 MB | `public/images/generated/lifestyle/organic-ingredients.png` |
| 2.2 MB | `public/images/generated/lifestyle/premium-home.png` |

Full list available via: `node scripts/production-deployment-audit.mjs | jq '.top100Files'`

**Recommendation:** Convert production-bound PNGs to WebP/AVIF (many paths already have WebP counterparts under `public/images/real/` and `public/images/hero/`). Keep generated PNGs local-only or in object storage.

---

## 4. Duplicate assets

**347 duplicate groups** detected (SHA-256, files > 4 KB in `public/`).

Common patterns:

| Pattern | Example |
|---------|---------|
| `real/` ↔ `products/phase-8-5/` | Same product packaging bytes copied across folders |
| `real/hero/` ↔ `hero/` | Trust-background WebP sets duplicated |
| `baby-wash` ↔ `baby-shampoo` | Identical placeholder product angles |

**Sample duplicate pair:**

```
public/images/real/products/baby-wash/front.webp
public/images/real/products/baby-shampoo/front.webp   (identical hash)
```

**Recommendation (manual review):**

1. Deduplicate product packaging — use one canonical path per SKU/angle.
2. Remove superseded `phase-8-5a-scenes/` PNGs if WebP/responsive sets are canonical.
3. Do **not** auto-delete — some duplicates may be intentional fallbacks.

---

## 5. Unused images

**String-scan heuristic:** 1,595 images in `public/` not referenced by basename/path in `src/`, `scripts/`, `tests/`, or `supabase/`.

> **Caveat:** Many are **false positives** — referenced dynamically via `asset-catalog.ts`, Next.js `Image` responsive variants, or runtime CMS paths.

**Confirmed unused (safe to review):**

| File | Size | Notes |
|------|------|-------|
| `public/file.svg` | 391 B | Default Next.js stub |
| `public/globe.svg` | 1.0 KB | Default Next.js stub |
| `public/next.svg` | 1.3 KB | Default Next.js stub |
| `public/vercel.svg` | 128 B | Default Next.js stub |
| `public/window.svg` | 385 B | Default Next.js stub |

**Likely unused pipeline artifacts (review before delete):**

- `public/images/products/phase-8-5a-scenes/*.png` (~150 KB each)
- Many `public/images/generated/**/*.png` if WebP/production paths are canonical
- Responsive/thumb variants where parent path is referenced but variant basename is not

**Recommendation:** Run `npm run assets:report` / `npm run brand:audit` before removing any image. Do not bulk-delete `generated/`.

---

## 6. Unused videos

**None found.** Zero video files (`.mp4`, `.webm`, `.mov`, etc.) in the project.

---

## 7. Unused fonts

**No local font files** (`.woff`, `.woff2`, `.ttf`, `.otf`) in the repository.

Typography is loaded via **`next/font/google`** — Montserrat in `src/app/layout.tsx`:

- Heading: `Montserrat` (weights 600, 700, 800) → `--font-montserrat`
- Body: system stack `"Helvetica Neue", Helvetica, sans-serif` in `globals.css`

Fonts are downloaded at build time by Next.js — no static font assets to prune.

---

## 8. Unused npm packages

`depcheck` results:

| Category | Package | Verdict |
|----------|---------|---------|
| dependencies | *(none)* | All 14 production deps appear used |
| devDependencies | `@tailwindcss/postcss` | **False positive** — used in `postcss.config.mjs` |
| devDependencies | `tailwindcss` | **False positive** — used via PostCSS/Tailwind v4 |
| devDependencies | `eslint-config-next` | **False positive** — used in ESLint flat config |
| devDependencies | `@vitest/coverage-v8` | Used only when running `npm run test:coverage` |

**Production dependencies (all required):**

`next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`, `framer-motion`, `lucide-react`, `zod`, `clsx`, `tailwind-merge`, `@radix-ui/react-dialog`, `@sentry/nextjs`, `server-only`

**Recommendation:** Keep all current dependencies. Do not remove Tailwind/ESLint/Vitest coverage packages.

---

## 9. Build caches — exclude from deploy

These paths must **never** ship to production:

| Path | Size | Safe local cleanup command |
|------|------|----------------------------|
| `.next/` | 99.9 MB | `rm -rf .next` |
| `.next/cache/` | 1.8 MB | `rm -rf .next/cache` |
| `node_modules/` | 593.7 MB | `rm -rf node_modules && npm ci` |
| `coverage/` | 3.8 KB | `rm -rf coverage` |
| `tools/comfyui/` | 27.4 GB | Local dev only — already gitignored |

**Vercel/CI:** Platform rebuilds `.next/` and installs `node_modules` automatically. No manual cache upload needed.

---

## 10. `.gitignore` audit

| Pattern | Required | Present | Status |
|---------|----------|---------|--------|
| `node_modules` | Yes | `/node_modules` | ✅ |
| `.next` | Yes | `/.next/` | ✅ |
| `coverage` | Yes | `/coverage` | ✅ |
| `cache` / build cache | Yes | Partial | ⚠️ `.next/cache` covered by `/.next/`; no explicit `.turbo` or `*.tsbuildinfo` beyond `*.tsbuildinfo` |
| `logs` | Yes | `npm-debug.log*`, etc. | ✅ |
| `temp` / OS junk | Yes | `.DS_Store` | ✅ |
| `.env*` | Yes | `.env*` | ✅ |
| ComfyUI / models | Yes | `tools/comfyui/...` | ✅ |
| Generated images | Yes | `public/images/generated/**/*` | ✅ |

**Suggested `.gitignore` additions (optional, not applied):**

```gitignore
# build / test caches
.turbo/
.vitest/
.eslintcache

# local logs
*.log
logs/

# temp
tmp/
.temp/
```

---

## 11. Recommendations

### Critical (before production launch)

1. **Decide asset strategy for `public/images/generated/`** — 236 MB local, gitignored. Either promote curated WebP to tracked paths under `public/images/real/` / `hero/`, or upload to Supabase Storage / CDN.
2. **Exclude `tools/comfyui/` from any deploy bundle** — 96% of disk usage; already gitignored.
3. **Ensure CI runs `npm run build`** — do not commit `.next/` to git.

### High impact (size & performance)

4. **Deduplicate product images** — 347 duplicate groups; consolidate `real/` vs `phase-8-5/` copies (~200+ KB recoverable, more if PNG sets removed).
5. **Remove default Next.js SVG stubs** in `public/` if unused (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) — ~3 KB total, reduces clutter.
6. **Optimize mascot icons** — top icon files are ~1.2 MB WebP each; consider smaller dimensions for nav usage.

### Medium (operational)

7. **Add `.turbo/` and `.eslintcache` to `.gitignore`** if using Turbopack cache persistence across machines.
8. **Run `npm run assets:report`** periodically to reconcile catalog vs disk.
9. **Pin CI Node version** and enable `node_modules` caching — avoids shipping 594 MB in artifacts.

### Safe local cleanup (does not delete production assets)

```bash
# Regeneratable caches only
rm -rf .next/cache coverage

# Full rebuild (when debugging build issues)
rm -rf .next && npm run build
```

**Do NOT run without review:**

```bash
# NEVER in production prep without asset audit
rm -rf public/images/generated
rm -rf tools/comfyui   # destroys local AI models
```

---

## 12. Re-run audit

```bash
cd beyondbabyco
node scripts/production-deployment-audit.mjs > docs/production-audit.json
```

JSON output includes: folder sizes, top 100 files, duplicate samples, unused image counts, gitignore checks, and cache exclusion list.

---

## Appendix: Git vs disk state

| Metric | Value |
|--------|-------|
| Git tracked files in `public/` | **5** |
| Git tracked files in `public/images/generated/` | **0** (gitignored) |
| Local generated image files | **2,291** |
| Local PNG files in `public/` | **431** |
| Local WebP files in `public/` | **2,181** |

The repository git object store is minimal (~256 KB). Most visual assets exist **only on local disk** and are excluded from version control by design.
