import type { MetadataRoute } from "next";

import { getAllContentSlugs } from "@/lib/content/registry";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const contentRoutes: MetadataRoute.Sitemap = getAllContentSlugs().map((slug) => ({
    url: absoluteUrl(`/${slug}`),
    changeFrequency: "monthly" as const,
    priority: slug === "about" || slug === "faq" ? 0.8 : 0.6,
  }));

  const trustCenterRoute: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/trust-center"), changeFrequency: "weekly", priority: 0.85 },
  ];

  const communityRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/community"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/reviews/gallery"), changeFrequency: "weekly", priority: 0.75 },
  ];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/products"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/search"), changeFrequency: "weekly", priority: 0.5 },
    ...trustCenterRoute,
    ...communityRoutes,
    ...contentRoutes,
  ];

  try {
    const supabase = await createSupabaseServerClient();
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .in("status", ["active", "coming_soon"])
      .is("deleted_at", null);

    const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: absoluteUrl(`/products/${p.slug}`),
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
