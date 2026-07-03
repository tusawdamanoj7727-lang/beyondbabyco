/** Phase 8.1 asset slugs — used for CMS assign + manifest. */

export const MOTHER_BABY_SLUGS = Array.from({ length: 20 }, (_, i) =>
  `mother-baby-${String(i + 1).padStart(2, "0")}`,
);

export const HERO_BACKGROUND_SLUGS = Array.from({ length: 10 }, (_, i) =>
  `hero-background-${String(i + 1).padStart(2, "0")}`,
);

export const HERO_GLASS_SLUGS = Array.from({ length: 10 }, (_, i) =>
  `hero-glass-${String(i + 1).padStart(2, "0")}`,
);

export const TRUST_BACKGROUND_SLUGS = Array.from({ length: 10 }, (_, i) =>
  `trust-background-${String(i + 1).padStart(2, "0")}`,
);

export const ALL_HERO_SLUGS = [
  ...MOTHER_BABY_SLUGS,
  ...HERO_BACKGROUND_SLUGS,
  ...HERO_GLASS_SLUGS,
  ...TRUST_BACKGROUND_SLUGS,
];

export const STORAGE_PREFIX = "phase-8-1";
export const PUBLIC_PREFIX = `/images/hero/${STORAGE_PREFIX}`;

export function kindForSlug(slug) {
  if (slug.startsWith("mother-baby")) return "mother-baby";
  if (slug.startsWith("hero-background")) return "hero-background";
  if (slug.startsWith("hero-glass")) return "hero-glass";
  return "trust-background";
}

export function publicWebpPath(slug) {
  const kind = kindForSlug(slug);
  return `${PUBLIC_PREFIX}/${kind}/${slug}.webp`;
}

export function supabaseStoragePath(slug) {
  const kind = kindForSlug(slug);
  return `${STORAGE_PREFIX}/${kind}/${slug}.webp`;
}
