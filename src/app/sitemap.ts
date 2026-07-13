import type { MetadataRoute } from "next";

import { DEDICATED_CONTENT_SLUGS } from "@/lib/content/dedicated-routes";
import { getAllContentSlugs } from "@/lib/content/registry";
import { MASCOT_SLUGS } from "@/lib/mascots/content";
import { getCanonicalSiteUrl } from "@/lib/seo/site";

type SitemapEntry = MetadataRoute.Sitemap[number];

function staticPage(
  base: string,
  path: string,
  opts: Pick<SitemapEntry, "changeFrequency" | "priority">,
  lastModified = new Date(),
): SitemapEntry {
  const url = path ? `${base}${path.startsWith("/") ? path : `/${path}`}` : base;
  return { url, lastModified, ...opts };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getCanonicalSiteUrl();
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    staticPage(base, "", { changeFrequency: "daily", priority: 1.0 }, now),
    staticPage(base, "/products", { changeFrequency: "daily", priority: 0.9 }, now),
    staticPage(base, "/about", { changeFrequency: "monthly", priority: 0.7 }, now),
    staticPage(base, "/research", { changeFrequency: "monthly", priority: 0.7 }, now),
    staticPage(base, "/contact", { changeFrequency: "monthly", priority: 0.6 }, now),
    staticPage(base, "/faq", { changeFrequency: "monthly", priority: 0.5 }, now),
    staticPage(base, "/mascots", { changeFrequency: "monthly", priority: 0.6 }, now),
    staticPage(base, "/trust-center", { changeFrequency: "monthly", priority: 0.7 }, now),
    staticPage(base, "/community", { changeFrequency: "weekly", priority: 0.6 }, now),
    staticPage(base, "/reviews/gallery", { changeFrequency: "weekly", priority: 0.5 }, now),
    staticPage(base, "/privacy-policy", { changeFrequency: "yearly", priority: 0.3 }, now),
    staticPage(base, "/terms-of-service", { changeFrequency: "yearly", priority: 0.3 }, now),
    staticPage(base, "/shipping-policy", { changeFrequency: "monthly", priority: 0.4 }, now),
    staticPage(base, "/refund-policy", { changeFrequency: "monthly", priority: 0.4 }, now),
  ];

  const mascotUrls: MetadataRoute.Sitemap = MASCOT_SLUGS.map((slug) =>
    staticPage(base, `/mascots/${slug}`, { changeFrequency: "monthly", priority: 0.5 }, now),
  );

  const marketingSlugs = getAllContentSlugs().filter((slug) => !DEDICATED_CONTENT_SLUGS.has(slug));
  const contentUrls: MetadataRoute.Sitemap = marketingSlugs.map((slug) =>
    staticPage(base, `/${slug}`, { changeFrequency: "monthly", priority: 0.5 }, now),
  );

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

    return [...pages, ...mascotUrls, ...contentUrls, ...productUrls];
  } catch {
    return [...pages, ...mascotUrls, ...contentUrls];
  }
}
