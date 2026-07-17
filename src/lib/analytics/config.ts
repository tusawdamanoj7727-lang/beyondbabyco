/** Public analytics configuration — safe for client bundles. */

export function getGtmContainerId(): string | null {
  return process.env.NEXT_PUBLIC_GTM_CONTAINER_ID?.trim() || null;
}

export function getGa4MeasurementId(): string | null {
  return process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || null;
}

export function getGoogleAdsId(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || null;
}

export function getGoogleAdsPurchaseLabel(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL?.trim() || null;
}

export function getGoogleAdsBeginCheckoutLabel(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_BEGIN_CHECKOUT_LABEL?.trim() || null;
}

export function getGoogleAdsAddToCartLabel(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_ADD_TO_CART_LABEL?.trim() || null;
}

export function getMetaPixelId(): string | null {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null;
}

export function getClarityProjectId(): string | null {
  return process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || null;
}

export function isGtmEnabled(): boolean {
  return Boolean(getGtmContainerId());
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(
    getGtmContainerId() ||
      getGa4MeasurementId() ||
      getGoogleAdsId() ||
      getMetaPixelId() ||
      getClarityProjectId(),
  );
}
