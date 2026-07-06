import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site";

const BASE = getSiteUrl().replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/shipping-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/refund-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .in("status", ["active", "coming_soon"])
      .is("deleted_at", null);

    const productPages: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${BASE}/products/${p.slug}`,
      lastModified: new Date(p.updated_at ?? Date.now()),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
