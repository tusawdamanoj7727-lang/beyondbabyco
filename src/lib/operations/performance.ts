import type { PerformanceReportItem } from "./types";

/** Report-only performance summary — no new optimizations. */
export function getPerformanceReport(): PerformanceReportItem[] {
  return [
    {
      id: "bundle",
      label: "Bundle analysis",
      value: "Run npm run analyze",
      hint: "Set ANALYZE=true — add @next/bundle-analyzer for visual report",
      status: "warning",
    },
    {
      id: "images",
      label: "Image optimization",
      value: "AVIF + WebP",
      hint: "next/image with Supabase remote patterns; minimumCacheTTL 24h",
      status: "ready",
    },
    {
      id: "largest-pages",
      label: "Largest pages",
      value: "Homepage, PDP, Checkout",
      hint: "Monitor LCP on product detail and hero sections",
      status: "warning",
    },
    {
      id: "routes",
      label: "Static vs dynamic",
      value: "Mixed App Router",
      hint: "Storefront pages SSR/ISR; admin force-dynamic; health endpoints dynamic",
      status: "ready",
    },
    {
      id: "caching",
      label: "Caching",
      value: "Compress + CDN",
      hint: "next.config compress:true; image cache TTL; no full-page CDN cache on checkout",
      status: "ready",
    },
    {
      id: "lighthouse",
      label: "Lighthouse checklist",
      value: "6 items",
      hint: "HTTPS, meta description, tap targets, contrast, font-display, lazy images",
      status: "warning",
    },
    {
      id: "cwv",
      label: "Core Web Vitals",
      value: "Monitor in production",
      hint: "Target LCP < 2.5s, INP < 200ms, CLS < 0.1 — use GA4 or Vercel Analytics",
      status: "warning",
    },
    {
      id: "packages",
      label: "Package imports",
      value: "Optimized",
      hint: "lucide-react, @radix-ui/react-dialog tree-shaken",
      status: "ready",
    },
  ];
}

export function getLighthouseChecklist(): { item: string; status: "ready" | "warning" | "missing" }[] {
  return [
    { item: "Valid HTML document structure", status: "ready" },
    { item: "Meta description on key pages", status: "ready" },
    { item: "Responsive viewport meta tag", status: "ready" },
    { item: "Accessible color contrast", status: "warning" },
    { item: "Properly sized tap targets (mobile)", status: "warning" },
    { item: "Lazy-loaded below-fold images", status: "ready" },
    { item: "Font display swap", status: "warning" },
    { item: "No render-blocking third-party scripts", status: "warning" },
  ];
}
