/** Public analytics configuration — safe for client bundles. */

export function getGa4MeasurementId(): string | null {
  return process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || null;
}

export function getGtmContainerId(): string | null {
  return process.env.NEXT_PUBLIC_GTM_CONTAINER_ID?.trim() || null;
}

export function getMetaPixelId(): string | null {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null;
}

export function getClarityProjectId(): string | null {
  return process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || null;
}

/** True when storefront analytics scripts or listeners should run. */
export function isAnalyticsConfigured(): boolean {
  return Boolean(
    getGtmContainerId() || getGa4MeasurementId() || getMetaPixelId() || getClarityProjectId(),
  );
}

/** Prefer GTM dataLayer when a container is configured — avoids duplicate GA4 + GTM fires. */
export function usesGtmDataLayer(): boolean {
  return Boolean(getGtmContainerId());
}
