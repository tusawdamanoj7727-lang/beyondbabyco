import { describe, expect, it } from "vitest";

import {
  CORE_INGREDIENTS,
  QUALITY_STANDARDS,
  RESEARCH_PROCESS_STEPS,
  RESEARCH_PROCESS_FAQ,
  TRUST_WIDGETS,
  computeAverageRating,
  mergeTestimonials,
  TRUST_TESTIMONIALS,
} from "@/lib/trust";
import { faqJsonLd, organizationJsonLd, articleJsonLd } from "@/lib/seo/json-ld";
import { getAllContentSlugs } from "@/lib/content/registry";

describe("trust data", () => {
  it("defines 10 research process steps", () => {
    expect(RESEARCH_PROCESS_STEPS).toHaveLength(10);
    for (const step of RESEARCH_PROCESS_STEPS) {
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.illustration).toMatch(/^\/images\//);
      expect(step.cta.href).toMatch(/^\//);
    }
  });

  it("defines core ingredients with required fields", () => {
    expect(CORE_INGREDIENTS.length).toBeGreaterThanOrEqual(6);
    for (const ing of CORE_INGREDIENTS) {
      expect(ing.origin).toBeTruthy();
      expect(ing.purpose).toBeTruthy();
      expect(ing.benefits.length).toBeGreaterThan(0);
      expect(ing.safetyProfile).toBeTruthy();
      expect(ing.relatedProducts.length).toBeGreaterThan(0);
    }
  });

  it("defines 10 quality standards", () => {
    expect(QUALITY_STANDARDS).toHaveLength(10);
  });

  it("defines 8 trust widgets", () => {
    expect(TRUST_WIDGETS).toHaveLength(8);
  });

  it("computes average rating", () => {
    const avg = computeAverageRating(TRUST_TESTIMONIALS);
    expect(avg).toBeGreaterThanOrEqual(4);
    expect(avg).toBeLessThanOrEqual(5);
  });

  it("merges CMS testimonials with static fallbacks", () => {
    const merged = mergeTestimonials([]);
    expect(merged.length).toBeGreaterThanOrEqual(3);
  });
});

describe("trust SEO schemas", () => {
  it("builds FAQ schema from research process FAQ", () => {
    const schema = faqJsonLd(RESEARCH_PROCESS_FAQ);
    expect(schema).not.toBeNull();
    expect(schema).toMatchObject({ "@type": "FAQPage" });
  });

  it("extends organization schema with trust fields", () => {
    const org = organizationJsonLd();
    expect(org).toMatchObject({
      "@type": "Organization",
      foundingDate: "2021",
      areaServed: "IN",
    });
  });

  it("builds article schema for trust center", () => {
    const article = articleJsonLd({
      title: "Trust Center",
      description: "Trust content",
      path: "/trust-center",
    });
    expect(article).toMatchObject({ "@type": "Article", headline: "Trust Center" });
  });
});

describe("content registry", () => {
  it("includes trust-related marketing pages", () => {
    const slugs = getAllContentSlugs();
    expect(slugs).toContain("research");
    expect(slugs).toContain("ingredients");
    expect(slugs).toContain("certifications");
    expect(slugs).toContain("safety-standards");
  });
});
