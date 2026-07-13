import type { NextConfig } from "next";

import bundleAnalyzer from "@next/bundle-analyzer";

import { getNextConfigSecurityHeaders } from "./src/lib/security/headers";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** Keep in sync with src/lib/media/image-delivery.ts CDN_CACHE_POLICY */
const CACHE = {
  immutableStatic: "public, max-age=31536000, immutable",
  nextImageOptimized: "public, max-age=86400, stale-while-revalidate=604800",
} as const;

// Deployment: Vercel (primary). Docker config kept for future self-hosting reference.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://beyondbabyco.in",
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "BeyondBabyCo",
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [48, 64, 96, 128, 256, 384, 400, 640],
    minimumCacheTTL: 60 * 60 * 24,
    dangerouslyAllowSVG: false,
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-toast",
      "date-fns",
      "@supabase/supabase-js",
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: getNextConfigSecurityHeaders(),
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: CACHE.immutableStatic }],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: CACHE.immutableStatic }],
      },
      {
        source: "/_next/image",
        headers: [{ key: "Cache-Control", value: CACHE.nextImageOptimized }],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/terms", destination: "/terms-of-service", permanent: true },
      { source: "/return-policy", destination: "/refund-policy", permanent: true },
      { source: "/cookies", destination: "/privacy-policy", permanent: true },
      // /blog has no route — keep redirect until a blog is published.
      { source: "/blog", destination: "/about", permanent: false },
    ];
  },
};

function wrapWithSentry(config: NextConfig): NextConfig {
  if (!process.env.SENTRY_DSN) return config;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { withSentryConfig } = require("@sentry/nextjs") as typeof import("@sentry/nextjs");
    return withSentryConfig(config, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      sourcemaps: { disable: false },
      disableLogger: true,
      automaticVercelMonitors: true,
    });
  } catch {
    return config;
  }
}

export default withBundleAnalyzer(wrapWithSentry(nextConfig));
