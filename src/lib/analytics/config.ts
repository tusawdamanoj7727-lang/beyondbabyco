/** Public analytics configuration — safe for client bundles. */

export function getGa4MeasurementId(): string | null {
  return process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || null;
}

export function getMetaPixelId(): string | null {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null;
}

export function getClarityProjectId(): string | null {
  return process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || null;
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(getGa4MeasurementId() || getMetaPixelId() || getClarityProjectId());
}
