/** GST % for baby care (HSN 3304 baby toiletries). */
export const GST_RATE_BABY = 12;

/** GST % for hair oils / ayurvedic massage oils (HSN 3305). */
export const GST_RATE_OIL = 18;

export const MRP_INCLUSIVE_TAX_LABEL = "MRP incl. of all taxes";

/** Category slug → GST % (used when DB gst_rate is unset). */
export const CATEGORY_GST_RATES: Record<string, number> = {
  "baby-wipes": GST_RATE_BABY,
  "baby-wash": GST_RATE_BABY,
  "baby-lotion": GST_RATE_BABY,
  "baby-shampoo": GST_RATE_BABY,
  "baby-cream": GST_RATE_BABY,
  "baby-powder": GST_RATE_BABY,
  "baby-soap": GST_RATE_BABY,
  "diaper-rash-cream": GST_RATE_BABY,
  "gift-sets": GST_RATE_BABY,
  "travel-kits": GST_RATE_BABY,
  "accessories": GST_RATE_BABY,
  "mother-care": GST_RATE_BABY,
  "baby-oil": GST_RATE_OIL,
  "massage-oil": GST_RATE_OIL,
};

export function gstRateForCategory(categorySlug: string | null | undefined): number {
  if (!categorySlug) return GST_RATE_BABY;
  return CATEGORY_GST_RATES[categorySlug] ?? GST_RATE_BABY;
}

export function resolveProductGstRate(
  gstRateFromDb: number | null | undefined,
  categorySlug?: string | null,
): number {
  if (gstRateFromDb != null && gstRateFromDb > 0) return gstRateFromDb;
  return gstRateForCategory(categorySlug);
}

/** GST component from an MRP-inclusive line total at the given rate. */
export function gstFromInclusiveLine(lineTotal: number, gstRate: number): number {
  if (lineTotal <= 0 || gstRate <= 0) return 0;
  return Math.round(((lineTotal * gstRate) / (100 + gstRate)) * 100) / 100;
}

export function formatGstRateLabel(gstRate: number): string {
  const rounded = Number.isInteger(gstRate) ? gstRate : gstRate.toFixed(2);
  return `GST (${rounded}%)`;
}
