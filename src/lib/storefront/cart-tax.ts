import {
  gstFromInclusiveLine,
  GST_RATE_BABY,
  resolveProductGstRate,
} from "@/lib/catalog/gst-rates";
import type { CartItem } from "./cart-types";

export { GST_RATE_BABY as DEFAULT_BABY_GST_RATE, GST_RATE_OIL as COSMETICS_GST_RATE } from "@/lib/catalog/gst-rates";

export function resolveCartItemGstRate(item: CartItem): number {
  return resolveProductGstRate(item.gstRate, null);
}

export type CartGstBreakdownLine = {
  rate: number;
  amount: number;
};

export type CartGstBreakdown = {
  lines: CartGstBreakdownLine[];
  total: number;
  /** True when cart has more than one distinct GST rate. */
  isMixed: boolean;
};

/**
 * GST breakdown from MRP-inclusive line totals, after proportional coupon discount.
 * Tax component per line: discountedLine × rate ÷ (100 + rate).
 */
export function calcCartGstBreakdown(items: CartItem[], couponDiscount = 0): CartGstBreakdown {
  const lineTotals = items.map((item) => item.price * item.quantity);
  const subtotal = lineTotals.reduce((sum, n) => sum + n, 0);
  if (subtotal <= 0) {
    return { lines: [], total: 0, isMixed: false };
  }

  const discountRatio = Math.min(1, Math.max(0, couponDiscount / subtotal));
  const byRate = new Map<number, number>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const lineTotal = lineTotals[i]!;
    const discountedLine = lineTotal * (1 - discountRatio);
    const rate = resolveCartItemGstRate(item);
    const gst = gstFromInclusiveLine(discountedLine, rate);
    byRate.set(rate, (byRate.get(rate) ?? 0) + gst);
  }

  const lines = [...byRate.entries()]
    .map(([rate, amount]) => ({
      rate,
      amount: Math.round(amount * 100) / 100,
    }))
    .sort((a, b) => a.rate - b.rate);

  const total = Math.round(lines.reduce((sum, line) => sum + line.amount, 0) * 100) / 100;

  return {
    lines,
    total,
    isMixed: lines.length > 1,
  };
}

/** @deprecated Use calcCartGstBreakdown — kept for checkout compat. */
export function calcCartGstTotal(items: CartItem[], couponDiscount = 0): number {
  return calcCartGstBreakdown(items, couponDiscount).total;
}
