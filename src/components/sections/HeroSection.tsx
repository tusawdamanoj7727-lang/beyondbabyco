import Link from "next/link";
import { Globe, Leaf, ShieldCheck } from "lucide-react";

import HeroBackground from "../homepage/HeroBackground";
import HeroVisual from "../homepage/HeroVisual";
import Badge from "../ui/Badge";
import AccentBar from "../ui/AccentBar";
import { HERO } from "@/lib/brand/copy";
import type { ResolvedHeroContent } from "@/lib/homepage/hero-content";
import { ctaHeight, focusRing, motionButton, trustIconSize } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const TRUST_BADGES = HERO.trustBadges;

const TRUST_ICONS: Record<string, typeof ShieldCheck> = {
  "dermatologically-tested": ShieldCheck,
  "made-in-india": Globe,
  "natural-ingredients": Leaf,
};

const heroCtaPrimary = cn(
  "btn-primary-premium hero-cta-primary inline-flex w-full items-center justify-center rounded-full px-7 text-base font-semibold sm:w-auto sm:min-w-[11rem]",
  ctaHeight,
  motionButton,
  focusRing,
);

const heroCtaSecondary = cn(
  "btn-secondary-premium hero-cta-secondary inline-flex w-full items-center justify-center rounded-full px-6 text-base font-semibold sm:w-auto",
  ctaHeight,
  motionButton,
  focusRing,
);

function TrustBadgeIcon({ slug, label }: { slug: string; label: string }) {
  const Icon = TRUST_ICONS[slug] ?? ShieldCheck;
  return (
    <Badge className="trust-badge-pill inline-flex items-center gap-2 py-1.5 pl-2.5 pr-3.5" size="sm">
      <Icon aria-hidden="true" className={cn("icon-outline text-green-600", trustIconSize)} strokeWidth={1.75} />
      {label}
    </Badge>
  );
}

export default function HeroSection({ hero }: { hero: ResolvedHeroContent }) {
  const primaryHref = hero.primaryCtaUrl ?? "#products";
  const secondaryHref = hero.secondaryCtaUrl ?? "#research";

  return (
    <section
      id="home"
      className="homepage-hero relative flex min-h-[72dvh] items-center overflow-hidden sm:min-h-[82dvh] lg:min-h-[84dvh]"
    >
      <HeroBackground />

      <div className="container relative z-10 w-full py-6 sm:py-8 lg:py-10">
        <div className="homepage-split-grid grid grid-cols-1 items-center lg:grid-cols-2 xl:gap-20">
          <div className="hero-copy hero-copy-block flex w-full max-w-[34rem] flex-col items-start">
            <Badge variant="default" size="md">
              {hero.eyebrow}
            </Badge>

            <h1 className="text-hero text-balance">
              {hero.title.includes("\n") ? (
                hero.title.split("\n").map((line, i, arr) => (
                  <span key={line}>
                    {line}
                    {i < arr.length - 1 ? <br /> : null}
                  </span>
                ))
              ) : (
                hero.title
              )}
            </h1>

            <AccentBar width="lg" align="left" />

            <p className="text-body prose-measure text-green-800/88">{hero.subtitle}</p>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
              {hero.primaryCtaUrl ? (
                <Link href={primaryHref} className={heroCtaPrimary}>
                  {hero.primaryCta}
                </Link>
              ) : (
                <a href={primaryHref} className={heroCtaPrimary}>
                  {hero.primaryCta}
                </a>
              )}
              {hero.secondaryCtaUrl ? (
                <Link href={secondaryHref} className={heroCtaSecondary}>
                  {hero.secondaryCta}
                </Link>
              ) : (
                <a href={secondaryHref} className={heroCtaSecondary}>
                  {hero.secondaryCta}
                </a>
              )}
            </div>

            <div className="hero-trust-row flex flex-wrap items-center gap-2.5">
              {TRUST_BADGES.map((badge) => (
                <TrustBadgeIcon key={badge.slug} slug={badge.slug} label={badge.label} />
              ))}
            </div>
          </div>

          <div className="relative w-full lg:justify-self-end">
            <HeroVisual heroImageUrl={hero.imageUrl} heroImageAlt={hero.imageAlt} />
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-14 bg-gradient-to-b from-transparent via-cream-50/45 to-cream-50"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        className="pointer-events-none absolute bottom-0 left-0 z-[2] h-5 w-full text-cream-50 sm:h-6"
      >
        <path
          fill="currentColor"
          d="M0,32 C240,8 480,44 720,28 C960,12 1200,40 1440,24 L1440,48 L0,48 Z"
        />
      </svg>
    </section>
  );
}
