import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl().replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/account/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
