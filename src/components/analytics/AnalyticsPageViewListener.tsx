"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { isAnalyticsConfigured } from "@/lib/analytics/config";
import { trackPageView } from "@/lib/analytics/events";

/** Fires page_view on App Router navigations (GA4 + Meta). */
export default function AnalyticsPageViewListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isAnalyticsConfigured()) return;
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    trackPageView(path, document.title);
  }, [pathname, searchParams]);

  return null;
}
