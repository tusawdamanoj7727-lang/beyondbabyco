/** Public analytics configuration — safe for client bundles. Env-driven only (never hardcode IDs). */

/**
 * Analytics must run only on Vercel Production (or non-Vercel production builds).
 * Development, Preview, and local `next start` without VERCEL_ENV=production are blocked.
 */
export function isProductionAnalyticsRuntime(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv) return vercelEnv === "production";
  // Non-Vercel production hosts (e.g. custom Docker) still allow analytics when NODE_ENV=production.
  return true;
}

export function getGtmContainerId(): string | null {
  if (!isProductionAnalyticsRuntime()) return null;
  return process.env.NEXT_PUBLIC_GTM_CONTAINER_ID?.trim() || null;
}

export function getGa4MeasurementId(): string | null {
  if (!isProductionAnalyticsRuntime()) return null;
  return process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || null;
}

export function getGoogleAdsId(): string | null {
  if (!isProductionAnalyticsRuntime()) return null;
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || null;
}

export function getGoogleAdsPurchaseLabel(): string | null {
  if (!isProductionAnalyticsRuntime()) return null;
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL?.trim() || null;
}

export function getGoogleAdsBeginCheckoutLabel(): string | null {
  if (!isProductionAnalyticsRuntime()) return null;
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_BEGIN_CHECKOUT_LABEL?.trim() || null;
}

export function getGoogleAdsAddToCartLabel(): string | null {
  if (!isProductionAnalyticsRuntime()) return null;
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_ADD_TO_CART_LABEL?.trim() || null;
}

export function getMetaPixelId(): string | null {
  if (!isProductionAnalyticsRuntime()) return null;
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null;
}

export function getClarityProjectId(): string | null {
  if (!isProductionAnalyticsRuntime()) return null;
  return process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || null;
}

export function isGtmEnabled(): boolean {
  return Boolean(getGtmContainerId());
}

export function isAnalyticsConfigured(): boolean {
  if (!isProductionAnalyticsRuntime()) return false;
  return Boolean(
    getGtmContainerId() ||
      getGa4MeasurementId() ||
      getGoogleAdsId() ||
      getMetaPixelId() ||
      getClarityProjectId(),
  );
}
