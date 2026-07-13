"use client";

import dynamic from "next/dynamic";

/** Non-critical UI — deferred to shrink the root layout client bundle. */
export const ScrollRevealObserver = dynamic(
  () => import("@/components/ui/ScrollRevealObserver"),
  { ssr: false },
);

export const WhatsAppButton = dynamic(
  () => import("@/components/ui/WhatsAppButton").then((m) => ({ default: m.WhatsAppButton })),
  { ssr: false },
);

export const AppToaster = dynamic(
  () => import("@/components/ui/AppToaster").then((m) => ({ default: m.AppToaster })),
  { ssr: false },
);

export const AnalyticsRoot = dynamic(
  () => import("@/components/analytics/AnalyticsRoot"),
  { ssr: false },
);

export const FloatingLogo = dynamic(
  () => import("@/components/layout/FloatingLogo"),
  { ssr: false },
);
