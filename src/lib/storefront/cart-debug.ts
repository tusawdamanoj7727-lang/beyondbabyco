/** Temporary cart quantity tracing — remove after root cause is fixed. */
const ENABLED =
  typeof window !== "undefined" &&
  (process.env.NEXT_PUBLIC_CART_DEBUG === "1" || process.env.NODE_ENV === "development");

export type CartQtySnapshot = { variantId: string; quantity: number }[];

export function snapshotCartQty(items: { variantId: string; quantity: number }[]): CartQtySnapshot {
  return items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
}

export function logCartQty(
  label: string,
  before: CartQtySnapshot,
  after: CartQtySnapshot,
  extra?: Record<string, unknown>,
): void {
  if (!ENABLED) return;
  const changed =
    before.length !== after.length ||
    before.some((b, idx) => {
      const a = after[idx];
      return !a || a.variantId !== b.variantId || a.quantity !== b.quantity;
    });
  if (!changed && !extra?.force) return;

  console.groupCollapsed(`[cart-qty] ${label}`);
  console.log("before", before);
  console.log("after", after);
  if (extra) console.log("extra", extra);
  console.trace("stack");
  console.groupEnd();
}
