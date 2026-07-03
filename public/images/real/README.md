# Real Brand Assets — Production Drop Zone

Drop production photography here. Run `npm run brand:assets` (or `npm run brand:sync-real` then `npm run brand:icons`) to rescan and update the manifest.

## Structure

Keys mirror AI Asset Manager `{category}/{slug}` paths used by `genVisual()`:

```
real/
  hero/
    phase-8-1/
      mother-baby/{slug}.webp
      hero-background/{slug}.webp
      hero-glass/{slug}.webp
      trust-background/{slug}.webp
  products/
    {line}/
      front.webp
      front-45.webp
      back.webp
      top.webp
      side.webp
      lifestyle.webp
      bathroom.webp
      nursery.webp
  categories/
    {slug}.webp
  og/
    home.png
    products/{slug}.png
```

Supported formats: `.webp`, `.png`, `.jpg`

**Automatic sync:** `npm run brand:sync-real` copies Phase 8.1 hero WebP and Phase 8.5 packaging into this folder from production sources. When a real asset exists, the storefront resolver prefers it over QC-approved FLUX editorial automatically.
