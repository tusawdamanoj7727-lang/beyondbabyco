import HideOnAdmin from "@/components/layout/HideOnAdmin";
import AnalyticsPageViewListener from "@/components/analytics/AnalyticsPageViewListener";
import ProductionAnalyticsScripts from "@/components/analytics/ProductionAnalyticsScripts";
import { Suspense } from "react";

/** Storefront-only analytics wiring — excluded from admin. */
export default function AnalyticsRoot() {
  return (
    <HideOnAdmin>
      <ProductionAnalyticsScripts />
      <Suspense fallback={null}>
        <AnalyticsPageViewListener />
      </Suspense>
    </HideOnAdmin>
  );
}
