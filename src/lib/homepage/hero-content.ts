/**
 * Phase 13.1 — Homepage hero copy resolver.
 * Priority: published CMS → brand copy (copy.ts) → emergency fallback.
 */

import { HERO as BRAND_HERO } from "@/lib/brand/copy";

import type { HomepageHeroSlide } from "./queries";
import { HERO_DEFAULT_IMAGE } from "./visual-assets";

/** Seed / Phase-8 placeholder strings — treated as unset so brand copy wins. */
export const LEGACY_HERO_COPY = [
  "every baby deserves the safest touch",
  "beyondbabyco hero",
  "premium baby care for indian families",
  "launching soon",
  "research-backed baby care • 2026",
] as const;

/** Last-resort strings if brand copy is ever removed. */
export const HERO_EMERGENCY_FALLBACK = {
  eyebrow: "Created with parents • Refined through research",
  title: "Gentle care.\nBacked by science.",
  subtitle:
    "Thoughtfully developed for everyday baby care using carefully selected ingredients and research-led formulations.",
  primaryCta: "Explore Collection",
  secondaryCta: "Our Research",
  imageAlt: "BeyondBabyCo — gentle baby care",
} as const;

export type ResolvedHeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  primaryCtaUrl: string | null;
  secondaryCtaUrl: string | null;
  imageUrl: string;
  imageAlt: string;
  /** Which layer supplied the copy fields (image may still come from CMS). */
  copySource: "cms" | "brand" | "emergency";
};

function normalizeCopy(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isLegacyHeroCopy(value: string | null | undefined): boolean {
  const normalized = normalizeCopy(value ?? "");
  if (!normalized) return true;
  return LEGACY_HERO_COPY.some(
    (legacy) => normalized === legacy || normalized.includes(legacy),
  );
}

function cmsCopyField(
  value: string | null | undefined,
  published: boolean,
): string | null {
  if (!published) return null;
  const trimmed = value?.trim();
  if (!trimmed || isLegacyHeroCopy(trimmed)) return null;
  return trimmed;
}

function brandCopy() {
  return {
    eyebrow: BRAND_HERO.badge,
    title: BRAND_HERO.headline,
    subtitle: BRAND_HERO.subcopy,
    primaryCta: BRAND_HERO.primaryCta,
    secondaryCta: BRAND_HERO.secondaryCta,
    imageAlt: BRAND_HERO.imageAlt,
  };
}

/**
 * Resolve homepage hero copy and imagery for the storefront.
 * CMS overrides apply only when the homepage is published and fields are non-legacy.
 */
export function resolveHeroContent(
  cmsSlide: HomepageHeroSlide | undefined,
  published: boolean,
): ResolvedHeroContent {
  const brand = brandCopy();
  const emergency = HERO_EMERGENCY_FALLBACK;

  const cmsEyebrow = cmsCopyField(cmsSlide?.subtitle, published);
  const cmsTitle = cmsCopyField(cmsSlide?.title, published);
  const cmsSubtitle = cmsCopyField(cmsSlide?.description, published);
  const cmsPrimaryCta = cmsCopyField(cmsSlide?.ctaLabel, published);
  const cmsSecondaryCta = cmsCopyField(cmsSlide?.secondaryCtaLabel, published);

  const usedCmsCopy = Boolean(
    cmsEyebrow || cmsTitle || cmsSubtitle || cmsPrimaryCta || cmsSecondaryCta,
  );

  const copySource: ResolvedHeroContent["copySource"] = usedCmsCopy
    ? "cms"
    : brand.title
      ? "brand"
      : "emergency";

  const eyebrow = cmsEyebrow ?? brand.eyebrow ?? emergency.eyebrow;
  const title = cmsTitle ?? brand.title ?? emergency.title;
  const subtitle = cmsSubtitle ?? brand.subtitle ?? emergency.subtitle;
  const primaryCta = cmsPrimaryCta ?? brand.primaryCta ?? emergency.primaryCta;
  const secondaryCta = cmsSecondaryCta ?? brand.secondaryCta ?? emergency.secondaryCta;
  const imageAlt = cmsTitle ?? brand.imageAlt ?? emergency.imageAlt;

  const cmsImage = published ? cmsSlide?.imageUrl?.trim() : null;
  const imageUrl = cmsImage || HERO_DEFAULT_IMAGE;

  const primaryCtaUrl =
    published && cmsSlide?.ctaUrl?.trim() ? cmsSlide.ctaUrl.trim() : null;
  const secondaryCtaUrl =
    published && cmsSlide?.secondaryCtaUrl?.trim()
      ? cmsSlide.secondaryCtaUrl.trim()
      : null;

  return {
    eyebrow,
    title,
    subtitle,
    primaryCta,
    secondaryCta,
    primaryCtaUrl,
    secondaryCtaUrl,
    imageUrl,
    imageAlt,
    copySource,
  };
}
