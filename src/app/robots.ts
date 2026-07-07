import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://beyondbabyco.in").replace(/\/+$/, "");

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/account/"] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
