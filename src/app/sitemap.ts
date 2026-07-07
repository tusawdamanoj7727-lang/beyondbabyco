import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://beyondbabyco.in").replace(/\/+$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1.0, lastModified: new Date() },
    { url: `${BASE}/products`, changeFrequency: "daily", priority: 0.9, lastModified: new Date() },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.7, lastModified: new Date() },
    { url: `${BASE}/research`, changeFrequency: "monthly", priority: 0.7, lastModified: new Date() },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.6, lastModified: new Date() },
    { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.5, lastModified: new Date() },
    { url: `${BASE}/privacy-policy`, changeFrequency: "yearly", priority: 0.3, lastModified: new Date() },
    { url: `${BASE}/terms-of-service`, changeFrequency: "yearly", priority: 0.3, lastModified: new Date() },
    { url: `${BASE}/shipping-policy`, changeFrequency: "monthly", priority: 0.4, lastModified: new Date() },
    { url: `${BASE}/refund-policy`, changeFrequency: "monthly", priority: 0.4, lastModified: new Date() },
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
      url: `${BASE}/products/${pr.slug}`,
      lastModified: new Date(pr.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...pages, ...productUrls];
  } catch {
    return pages;
  }
}
