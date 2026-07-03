import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  BRAND_OG_HEIGHT,
  BRAND_OG_IMAGE,
  BRAND_OG_WIDTH,
  brandLogoPath,
} from "@/lib/brand/logo";
import {
  hasRealAsset,
  realAssetKey,
  resolveRealAssetUrl,
} from "@/lib/brand/real-assets";
import { genVisual } from "@/lib/brand/generated-assets";

describe("Phase 12.0 real brand assets", () => {
  it("logo paths resolve to distinct variant files", () => {
    expect(brandLogoPath("default")).toBe("/images/brand/logo.png");
    expect(brandLogoPath("dark")).toBe("/images/brand/logo-dark.png");
    expect(brandLogoPath("icon")).toBe("/images/brand/logo-icon.png");
  });

  it("OG image uses production 1200×630 dimensions", () => {
    expect(BRAND_OG_IMAGE).toBe("/images/brand/og-default.png");
    expect(BRAND_OG_WIDTH).toBe(1200);
    expect(BRAND_OG_HEIGHT).toBe(630);
  });

  it("real-assets-manifest.json is valid", () => {
    const path = join(process.cwd(), "src/lib/brand/real-assets-manifest.json");
    expect(existsSync(path)).toBe(true);
    const data = JSON.parse(readFileSync(path, "utf8"));
    expect(data.version).toBe("12.0");
    expect(data).toHaveProperty("assets");
  });

  it("realAssetKey format is category/slug", () => {
    expect(realAssetKey("products", "baby-wipes/front")).toBe("products/baby-wipes/front");
  });

  it("genVisual prefers real photography when manifest entry exists", () => {
    const heroSlug = "phase-8-1/mother-baby/mother-baby-07";
    if (hasRealAsset("hero", heroSlug)) {
      const v = genVisual({ category: "hero", slug: heroSlug });
      expect(v.url).toBe(resolveRealAssetUrl("hero", heroSlug));
      expect(v.url).toContain("/images/real/");
    } else {
      const v = genVisual({ category: "hero", slug: heroSlug });
      expect(v.url).toContain("/images/generated/");
    }
  });

  it("genVisual falls back to generated when no real asset", () => {
    if (!hasRealAsset("hero", "gentle-care-hero")) {
      const v = genVisual({ category: "hero", slug: "gentle-care-hero" });
      expect(v.url).toContain("/images/generated/");
    } else {
      const url = resolveRealAssetUrl("hero", "gentle-care-hero");
      expect(url).toContain("/images/real/");
    }
  });
});
