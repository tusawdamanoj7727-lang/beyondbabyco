"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { isAnalyticsConfigured } from "@/lib/analytics/config";
import { trackPageTypeView, trackPageView, trackSearch, type AnalyticsPageType } from "@/lib/analytics/events";

/** Fires page_view on App Router navigations (GA4 + Meta). */
export default function AnalyticsPageViewListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<string>("");

  useEffect(() => {
    if (!isAnalyticsConfigured()) return;
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    if (lastTrackedRef.current === path) return;
    lastTrackedRef.current = path;

    trackPageView(path, document.title);

    const pageType: AnalyticsPageType =
      pathname === "/"
        ? "homepage"
        : pathname === "/products"
          ? "collection"
          : pathname.startsWith("/products/")
            ? "product"
            : pathname === "/search"
              ? "search"
              : "other";

    const searchTerm = searchParams.get("q")?.trim() || undefined;
    trackPageTypeView({ type: pageType, path, title: document.title, searchTerm });
    if (pageType === "search" && searchTerm) {
      trackSearch({ searchTerm });
    }
  }, [pathname, searchParams]);

  return null;
}
