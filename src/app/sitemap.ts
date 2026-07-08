import type { MetadataRoute } from "next";

import { getCanonicalSiteUrl } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getCanonicalSiteUrl();

  const pages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1.0, lastModified: new Date() },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9, lastModified: new Date() },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.7, lastModified: new Date() },
    { url: `${base}/research`, changeFrequency: "monthly", priority: 0.7, lastModified: new Date() },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6, lastModified: new Date() },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.5, lastModified: new Date() },
    { url: `${base}/privacy-policy`, changeFrequency: "yearly", priority: 0.3, lastModified: new Date() },
    { url: `${base}/terms-of-service`, changeFrequency: "yearly", priority: 0.3, lastModified: new Date() },
    { url: `${base}/shipping-policy`, changeFrequency: "monthly", priority: 0.4, lastModified: new Date() },
    { url: `${base}/refund-policy`, changeFrequency: "monthly", priority: 0.4, lastModified: new Date() },
  ];

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .in("status", ["active", "coming_soon"])
      .is("deleted_at", null);

    const productUrls: MetadataRoute.Sitemap = (products ?? []).map((pr) => ({
      url: `${base}/products/${pr.slug}`,
      lastModified: new Date(pr.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...pages, ...productUrls];
  } catch {
    return pages;
  }
}
