import { afterEach, describe, expect, it, vi } from "vitest";

import { absoluteUrl, getSiteUrl, PRODUCTION_SITE_URL } from "@/lib/seo/site";

describe("seo/site", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses production URL when localhost is set in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    expect(getSiteUrl()).toBe(PRODUCTION_SITE_URL);
  });

  it("builds absolute URLs from production origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    expect(absoluteUrl("/products/baby-wipes")).toBe(
      "https://beyondbabyco.in/products/baby-wipes",
    );
  });

  it("allows localhost in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
