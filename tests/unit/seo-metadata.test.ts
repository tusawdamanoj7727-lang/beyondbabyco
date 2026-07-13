import { describe, expect, it } from "vitest";

import { stripJsonLdUndefined } from "@/components/seo/JsonLd";
import { buildPageMetadata, buildProductMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  itemListJsonLd,
  organizationJsonLd,
  productJsonLd,
} from "@/lib/seo/json-ld";
import { PRODUCTION_SITE_URL } from "@/lib/seo/site";

describe("buildPageMetadata", () => {
  it("sets canonical for homepage path", () => {
    const meta = buildPageMetadata({ title: "Home", path: "/" });
    expect(meta.alternates?.canonical).toBe(`${PRODUCTION_SITE_URL}/`);
  });

  it("defaults canonical to homepage when path is omitted", () => {
    const meta = buildPageMetadata({ title: "Home" });
    expect(meta.alternates?.canonical).toBe(`${PRODUCTION_SITE_URL}/`);
  });

  it("uses page title for openGraph image alt", () => {
    const meta = buildPageMetadata({ title: "FAQ", path: "/faq" });
    const images = meta.openGraph?.images;
    const firstImage = Array.isArray(images) ? images[0] : images;
    expect(firstImage).toMatchObject({ alt: "FAQ" });
  });

  it("includes twitter creator alongside site handle", () => {
    const meta = buildPageMetadata({ title: "About", path: "/about" });
    expect(meta.twitter).toMatchObject({
      site: "@beyondbabyco",
      creator: "@beyondbabyco",
    });
  });

  it("includes keywords when provided", () => {
    const meta = buildPageMetadata({
      title: "FAQ",
      path: "/faq",
      keywords: ["baby care", "BeyondBabyCo"],
    });
    expect(meta.keywords).toEqual(["baby care", "BeyondBabyCo"]);
  });
});

describe("buildProductMetadata", () => {
  it("sets openGraph type to product", () => {
    const meta = buildProductMetadata({
      title: "Baby Wipes",
      path: "/products/baby-wipes",
      productSlug: "baby-wipes",
    });
    expect(meta.openGraph).toMatchObject({ type: "product" });
  });
});

describe("breadcrumbJsonLd", () => {
  it("omits item on the last breadcrumb when url is absent", () => {
    const schema = breadcrumbJsonLd([
      { name: "Home", url: "/" },
      { name: "Products" },
    ]) as { itemListElement: Record<string, unknown>[] };

    expect(schema.itemListElement[0]).toMatchObject({
      name: "Home",
      item: `${PRODUCTION_SITE_URL}/`,
    });
    expect(schema.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "Products",
    });
    expect(schema.itemListElement[1]).not.toHaveProperty("item");
  });
});

describe("faqJsonLd", () => {
  it("returns null for empty FAQ list", () => {
    expect(faqJsonLd([])).toBeNull();
  });

  it("builds FAQPage schema", () => {
    const schema = faqJsonLd([{ question: "Q?", answer: "A." }]);
    expect(schema).toMatchObject({ "@type": "FAQPage" });
  });
});

describe("itemListJsonLd", () => {
  it("returns null for empty lists", () => {
    expect(itemListJsonLd([])).toBeNull();
  });

  it("builds absolute product URLs", () => {
    const schema = itemListJsonLd([{ name: "Wipes", url: "/products/wipes" }]);
    expect(schema?.itemListElement[0]).toMatchObject({
      url: `${PRODUCTION_SITE_URL}/products/wipes`,
    });
  });
});

describe("organizationJsonLd", () => {
  it("includes contact point and address", () => {
    const org = organizationJsonLd();
    expect(org).toMatchObject({
      contactPoint: {
        email: "care@beyondbabyco.com",
        contactType: "customer service",
      },
      address: {
        addressLocality: "Udaipur",
        addressRegion: "Rajasthan",
        addressCountry: "IN",
      },
      hasOfferCatalog: {
        url: `${PRODUCTION_SITE_URL}/products`,
      },
    });
  });
});

describe("productJsonLd", () => {
  it("includes sku, url, and absolute image without aggregateRating when count is zero", () => {
    const schema = productJsonLd({
      name: "Baby Wipes",
      description: "Gentle wipes",
      slug: "baby-wipes",
      imageUrl: "/images/wipes.png",
      price: 199,
      compareAtPrice: null,
      inStock: true,
      ratingAvg: 0,
      ratingCount: 0,
    }) as Record<string, unknown>;

    expect(schema.sku).toBe("baby-wipes");
    expect(schema.url).toBe(`${PRODUCTION_SITE_URL}/products/baby-wipes`);
    expect(schema.image).toEqual([`${PRODUCTION_SITE_URL}/images/wipes.png`]);
    expect(schema).not.toHaveProperty("aggregateRating");
  });
});

describe("stripJsonLdUndefined", () => {
  it("removes undefined nested keys from JSON-LD payloads", () => {
    const cleaned = stripJsonLdUndefined({
      "@type": "Product",
      aggregateRating: undefined,
      offers: { price: 199, seller: undefined },
    }) as Record<string, unknown>;

    expect(cleaned).not.toHaveProperty("aggregateRating");
    expect(cleaned.offers).toEqual({ price: 199 });
  });
});
