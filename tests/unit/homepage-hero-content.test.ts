import { describe, expect, it } from "vitest";

import { HERO } from "@/lib/brand/copy";
import {
  isLegacyHeroCopy,
  resolveHeroContent,
} from "@/lib/homepage/hero-content";
import type { HomepageHeroSlide } from "@/lib/homepage/queries";

const PLACEHOLDER_SLIDE: HomepageHeroSlide = {
  id: "test",
  title: "BeyondBabyCo Hero",
  subtitle: "Premium baby care for Indian families",
  description: "",
  imageUrl: "https://cdn.example/hero.webp",
  backgroundUrl: "",
  overlay: 0,
  ctaLabel: "",
  ctaUrl: "",
  secondaryCtaLabel: "",
  secondaryCtaUrl: "",
};

describe("Phase 13.1 homepage hero content", () => {
  it("treats Phase-8 placeholder CMS copy as legacy", () => {
    expect(isLegacyHeroCopy("BeyondBabyCo Hero")).toBe(true);
    expect(isLegacyHeroCopy("Every Baby Deserves The Safest Touch")).toBe(true);
    expect(isLegacyHeroCopy("Premium baby care for Indian families")).toBe(true);
  });

  it("uses brand copy when CMS is published but only has legacy placeholders", () => {
    const resolved = resolveHeroContent(PLACEHOLDER_SLIDE, true);
    expect(resolved.copySource).toBe("brand");
    expect(resolved.title).toBe(HERO.headline);
    expect(resolved.eyebrow).toBe(HERO.badge);
    expect(resolved.subtitle).toBe(HERO.subcopy);
    expect(resolved.primaryCta).toBe(HERO.primaryCta);
    expect(resolved.secondaryCta).toBe(HERO.secondaryCta);
  });

  it("uses brand copy when homepage is not published", () => {
    const resolved = resolveHeroContent(
      { ...PLACEHOLDER_SLIDE, title: "Custom CMS headline" },
      false,
    );
    expect(resolved.copySource).toBe("brand");
    expect(resolved.title).toBe(HERO.headline);
  });

  it("uses published CMS copy when fields are intentionally set", () => {
    const resolved = resolveHeroContent(
      {
        ...PLACEHOLDER_SLIDE,
        title: "Custom launch headline",
        subtitle: "New season editorial",
        description: "A bespoke hero message from CMS.",
        ctaLabel: "Shop now",
        secondaryCtaLabel: "Learn more",
        ctaUrl: "/products",
        secondaryCtaUrl: "/science",
      },
      true,
    );
    expect(resolved.copySource).toBe("cms");
    expect(resolved.title).toBe("Custom launch headline");
    expect(resolved.eyebrow).toBe("New season editorial");
    expect(resolved.subtitle).toBe("A bespoke hero message from CMS.");
    expect(resolved.primaryCta).toBe("Shop now");
    expect(resolved.primaryCtaUrl).toBe("/products");
  });

  it("keeps published CMS hero image when present", () => {
    const resolved = resolveHeroContent(PLACEHOLDER_SLIDE, true);
    expect(resolved.imageUrl).toBe("https://cdn.example/hero.webp");
  });
});
