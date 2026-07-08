import type { MetadataRoute } from "next";

import { getCanonicalSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const base = getCanonicalSiteUrl();

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/account/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
