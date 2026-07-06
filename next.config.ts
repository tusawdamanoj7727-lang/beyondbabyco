import type { NextConfig } from "next";

import { getNextConfigSecurityHeaders } from "./src/lib/security/headers";

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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [48, 64, 96, 128, 256, 384, 640],
    minimumCacheTTL: 60 * 60 * 24,
    dangerouslyAllowSVG: false,
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog"],
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
        source: "/_next/image",
        headers: [{ key: "Cache-Control", value: CACHE.nextImageOptimized }],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/terms", destination: "/terms-of-service", permanent: true },
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

export default wrapWithSentry(nextConfig);
