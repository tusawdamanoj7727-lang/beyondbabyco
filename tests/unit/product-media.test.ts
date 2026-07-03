import { describe, expect, it } from "vitest";

import { sectionFromStoragePath } from "@/lib/admin/product-media-paths";
import { suggestProductMediaSeo } from "@/lib/admin/product-media-seo";
import { validateProductMedia } from "@/lib/admin/product-media-validation";

describe("product media paths", () => {
  it("detects section from storage path", () => {
    const pid = "abc-123";
    expect(sectionFromStoragePath(`${pid}/packaging/front/foo.webp`, pid)).toBe("packaging-front");
    expect(sectionFromStoragePath(`${pid}/lifestyle/foo.webp`, pid)).toBe("lifestyle");
    expect(sectionFromStoragePath(`${pid}/uuid.jpg`, pid)).toBe("gallery");
  });
});

describe("product media seo", () => {
  it("suggests alt text with product name", () => {
    const seo = suggestProductMediaSeo({
      productName: "Pure Gentle Wipes",
      sectionId: "primary",
      originalFilename: "front.jpg",
    });
    expect(seo.alt).toContain("Pure Gentle Wipes");
    expect(seo.keywords).toContain("BeyondBabyCo");
  });
});

describe("product media validation", () => {
  it("warns on small primary images", () => {
    const issues = validateProductMedia({
      file: { name: "small.jpg", type: "image/jpeg", size: 100_000 },
      width: 300,
      height: 300,
      sectionId: "primary",
    });
    expect(issues.some((i) => i.code === "too_small")).toBe(true);
  });
});
