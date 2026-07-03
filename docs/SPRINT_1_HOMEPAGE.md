# Sprint 1 — Homepage Premium Experience

Luxury D2C polish for the BeyondBabyCo homepage. **UI-only** — no database, API, checkout, auth, payment, shipping, CMS schema, or business logic changes.

## Goals

- One visual grid across all homepage sections
- Refined whitespace, typography, image crops, and section rhythm
- Lighter glass depth, hover, and scroll reveals (CSS over Framer where possible)
- Remove duplicate decorations, overlapping blobs, heavy shadows, and empty space

## New primitives

| Component | Path | Role |
|-----------|------|------|
| `HomeSection` | `src/components/homepage/HomeSection.tsx` | Shared section shell: container, backdrop tone (`cream` / `white`), padding, `scroll-reveal` |
| `HomeSectionHeader` | `src/components/homepage/HomeSectionHeader.tsx` | Unified eyebrow → heading → accent → intro block |

CSS tokens live in `src/app/globals.css` under **Sprint 1 — Homepage premium grid & surfaces** (`.homepage-section`, `.homepage-section-header`, `.homepage-card`, `.homepage-media-frame`, etc.).

## Section audit & changes

### Hero

- Tighter min-height and vertical padding (`84–88dvh`, reduced py)
- Smaller bottom fade + wave divider (less dead space into Trust strip)
- Copy/CTA unchanged (Phase 13.1 resolution still applies)

### Featured Collection

- `HomeSection` + `HomeSectionHeader` + 4-column product grid
- Product crops: `object-[center_22%]`, subtle hover scale
- `homepage-product-card` glass; server-rendered with `ScrollReveal`

### Brand Promise

- Converted to **server component** (`HomeSection`, `ScrollReveal`)
- Removed `SectionMascot`, duplicate gradient overlay, Framer `Reveal`
- Card icons: lighter ring, no heavy shadow

### Science

- Server component; split layout on unified grid
- Removed Eli elephant mascot overlay
- Media frame uses `homepage-media-frame` + `object-[center_20%]`
- Stat pill uses existing `hero-stat-card` (soft shadow)

### Research (Timeline)

- Server component; removed side bunny mascot
- Timeline node + media crops aligned; lighter line gradient
- Alternating cards on 2-col grid at `md+`

### Lifestyle

- Server component; removed Benny bear overlay
- Hero lifestyle image `object-[center_22%]`; feature thumbnails cropped
- Cream tone section for rhythm vs adjacent white blocks

### Testimonials (`TestimonialShowcase`)

- Unified header classes; `homepage-card` hover on cards
- Tighter vertical rhythm; carousel/grid unchanged functionally

### Newsletter

- Removed animated floating Poppy panda + heavy `shadow-clay`
- Single editorial image with soft ring/shadow
- Simplified green gradient (no overlapping radial blobs)

### Footer

- Single linear gradient (removed dual radial overlays)
- Mascot family: smaller, no floating animation
- Contact CTA: `shadow-soft` instead of clay

### Supporting bands

| Section | Change |
|---------|--------|
| **TrustWidgets** | Lighter strip bg/borders |
| **StatsBar** | `HomeSection` compact; `homepage-stat-card` |
| **Beyond Care** | Server + `NotifyMeButton` island; cleaner crops |
| **Meet Our Friends** | Unchanged (mascot home section) |

## Section rhythm (tone alternation)

```
Hero (cream gradient)
→ Trust strip
→ Community / Stats (white)
→ Brand Promise (cream)
→ Science (white)
→ Quality / Featured (white)
→ Beyond Care (cream)
→ Lifestyle (cream)
→ Meet Our Friends
→ Research (white)
→ Testimonials (white)
→ Newsletter (green)
→ Footer (green-900)
```

Adjacent same-tone sections get slightly reduced top padding via CSS `[data-tone]` rule.

## Removed

- Section mascots from Brand Promise, Science, Lifestyle, Research Timeline
- Newsletter floating mascot + dual radial backgrounds
- Footer dual radial gradients + mascot float
- Framer `MotionSection` / `Reveal` on converted server sections
- Heavy `shadow-clay` on homepage media frames (replaced with `shadow-soft`)

## Performance notes

- Brand Promise, Science, Lifestyle, Research Timeline, Beyond Care, Featured Collection, Stats: **server components** with CSS `scroll-reveal`
- Client islands retained only where required: Newsletter form, Testimonial carousel/filters, Notify Me, Footer mascots, Meet Our Friends

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Files touched (summary)

- `src/components/homepage/HomeSection.tsx` (new)
- `src/components/homepage/HomeSectionHeader.tsx` (new)
- `src/components/homepage/HeroBackground.tsx` (simplified)
- `src/components/ui/PremiumSectionBackdrop.tsx` (simplified)
- `src/components/sections/*` — Hero, FeaturedProducts, BrandPromise, ScienceSection, LifestyleSection, ResearchTimeline, BeyondCareLinesSection, StatsBar, NewsletterCTA, Footer
- `src/components/trust/TestimonialShowcase.tsx`, `TrustWidgets.tsx`
- `src/components/homepage/HomePageContent.tsx` — static imports for server sections
- `src/app/globals.css` — Sprint 1 tokens
