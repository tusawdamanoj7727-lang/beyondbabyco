import { GST_RATE_OIL } from "@/lib/catalog/gst-rates";

/** Default HSN for baby toiletries / wipes / washes (GST 12%). */
export const HSN_BABY_TOILETRIES = "3401";

/** Default HSN for oils / cosmetics (GST 18%). */
export const HSN_OILS_COSMETICS = "3304";

const OIL_SLUG_HINTS = ["oil", "massage", "shampoo", "lotion", "cream"];

/**
 * Resolve HSN for an invoice line when the catalog does not store HSN.
 * Uses GST rate + product slug/name heuristics aligned with gst-rates comments.
 */
export function resolveInvoiceHsn(input: {
  taxRate: number;
  productSlug?: string | null;
  productName?: string | null;
}): string {
  const slug = (input.productSlug ?? "").toLowerCase();
  const name = (input.productName ?? "").toLowerCase();
  const hay = `${slug} ${name}`;

  if (input.taxRate >= GST_RATE_OIL) return HSN_OILS_COSMETICS;
  if (OIL_SLUG_HINTS.some((h) => hay.includes(h)) && input.taxRate >= 18) {
    return HSN_OILS_COSMETICS;
  }
  return HSN_BABY_TOILETRIES;
}
