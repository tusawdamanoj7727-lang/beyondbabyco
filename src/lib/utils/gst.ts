export const SELLER_STATE = "Rajasthan";

export type GstLineItem = {
  price: number;
  quantity: number;
  gstRate: number;
};

export type GstBreakdown = {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  isIntrastate: boolean;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** CGST+SGST (intrastate) or IGST (interstate) from line prices and per-item GST rates. */
export function calculateGST(items: GstLineItem[], buyerState: string): GstBreakdown {
  const isIntrastate = buyerState.trim().toLowerCase() === SELLER_STATE.toLowerCase();

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  for (const item of items) {
    const itemTotal = item.price * item.quantity;
    const gstAmount = Math.round((itemTotal * item.gstRate) / 100);
    if (isIntrastate) {
      cgst += gstAmount / 2;
      sgst += gstAmount / 2;
    } else {
      igst += gstAmount;
    }
  }

  cgst = round2(cgst);
  sgst = round2(sgst);
  igst = round2(igst);

  return {
    cgst,
    sgst,
    igst,
    total: round2(cgst + sgst + igst),
    isIntrastate,
  };
}

/** Apply proportional coupon discount before GST calculation. */
export function calculateGSTFromCart(
  items: GstLineItem[],
  buyerState: string,
  couponDiscount = 0,
): GstBreakdown {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (subtotal <= 0) {
    return { cgst: 0, sgst: 0, igst: 0, total: 0, isIntrastate: true };
  }

  const discountRatio = Math.min(1, Math.max(0, couponDiscount / subtotal));
  const adjusted = items.map((item) => ({
    price: item.price * (1 - discountRatio),
    quantity: item.quantity,
    gstRate: item.gstRate,
  }));

  return calculateGST(adjusted, buyerState);
}

/** Weighted average GST rate for display labels (e.g. CGST 9% + SGST 9% → 18% product). */
export function weightedGstRate(items: GstLineItem[]): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (subtotal <= 0) return 0;
  const weighted = items.reduce(
    (sum, item) => sum + item.price * item.quantity * item.gstRate,
    0,
  );
  return Math.round((weighted / subtotal) * 100) / 100;
}

export type GstDisplayLine = {
  label: string;
  amount: number;
};

/** Cart / checkout summary lines: CGST+SGST for Rajasthan, IGST for other states. */
export function gstDisplayLines(
  breakdown: GstBreakdown,
  items: GstLineItem[],
): GstDisplayLine[] {
  if (breakdown.total <= 0) return [];

  const effectiveRate = weightedGstRate(items);

  if (breakdown.isIntrastate) {
    const halfRate = effectiveRate > 0 ? effectiveRate / 2 : 0;
    const halfLabel = halfRate > 0 ? ` (${halfRate}%)` : "";
    return [
      { label: `CGST${halfLabel}`, amount: breakdown.cgst },
      { label: `SGST${halfLabel}`, amount: breakdown.sgst },
    ].filter((line) => line.amount > 0);
  }

  const rateLabel = effectiveRate > 0 ? ` (${effectiveRate}%)` : "";
  return [{ label: `IGST${rateLabel}`, amount: breakdown.igst }];
}

export function isIntrastateBuyer(buyerState: string): boolean {
  return buyerState.trim().toLowerCase() === SELLER_STATE.toLowerCase();
}
