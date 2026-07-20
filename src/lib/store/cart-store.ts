import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { analyticsItemFromCartItem } from "@/lib/analytics/items";
import { trackAddToCart, trackCouponApplied, trackRemoveFromCart } from "@/lib/analytics/events";
import { gstFromInclusiveLine } from "@/lib/catalog/gst-rates";
import { clampCartQuantity, CART_MIN_QUANTITY } from "@/lib/storefront/cart-types";

/** Merge only exact productId + variantId matches (never cross-variant). */
function sameProductLine(a: CartItem, b: CartItem): boolean {
  if (a.productId !== b.productId) return false;
  return a.variantId === b.variantId;
}

function mergeCartItems(items: CartItem[]): CartItem[] {
  const result: CartItem[] = [];

  for (const raw of items) {
    const item: CartItem = {
      ...raw,
      id: raw.id || `${raw.productId}:${raw.variantId}`,
      quantity: clampCartQuantity(raw.quantity),
      unit: raw.unit || raw.variantName || "",
      variantName: raw.variantName || raw.unit || "",
    };

    const matchIdx = result.findIndex((existing) => sameProductLine(existing, item));

    if (matchIdx < 0) {
      result.push(item);
      continue;
    }

    const existing = result[matchIdx]!;
    result[matchIdx] = {
      ...existing,
      id: `${existing.productId}:${existing.variantId}`,
      quantity: clampCartQuantity(existing.quantity + item.quantity),
      unit: existing.unit || item.unit,
      variantName: existing.variantName || item.variantName,
    };
  }

  return result;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  /** Size / volume label (e.g. "100 ml"). */
  unit: string;
  /** @deprecated Prefer `unit` — kept for persisted carts. */
  variantName: string;
  price: number;
  originalPrice: number;
  quantity: number;
  image: string;
  slug: string;
  gstRate: number;
}

export interface AppliedCoupon {
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  savings: number;
  /** When true, shipping is free regardless of subtotal threshold. */
  freeShipping?: boolean;
  /** Compatibility aliases for simpler coupon payloads. */
  type?: "percent" | "flat";
  value?: number;
}

interface CartStore {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  /** Remove by cart line id (`productId:variantId`). */
  removeItem: (lineId: string) => void;
  /** Update quantity by cart line id (`productId:variantId`). */
  updateQuantity: (lineId: string, quantity: number) => void;
  updateQty: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  replaceItems: (items: CartItem[]) => void;
  // Computed
  itemCount: () => number;
  subtotal: () => number;
  discount: () => number;
  gstAmount: () => number;
  gst: () => number;
  shippingCharge: () => number;
  shipping: () => number;
  total: () => number;
}

function couponType(coupon: AppliedCoupon): "percent" | "flat" {
  return coupon.discountType ?? coupon.type ?? "flat";
}

function couponValue(coupon: AppliedCoupon): number {
  return coupon.discountValue ?? coupon.value ?? 0;
}

const LEGACY_CART_STORAGE_KEY = "beyondbabyco-cart";

function migrateLegacyCartStorage(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem("bbc-cart")) return;
    const legacy = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    if (!legacy) return;
    localStorage.setItem("bbc-cart", legacy);
  } catch {
    // Ignore quota / private mode errors.
  }
}

if (typeof window !== "undefined") {
  migrateLegacyCartStorage();
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (newItem, quantity = 1) =>
        set((state) => {
          const qty = clampCartQuantity(quantity);
          const trackedItem = {
            ...newItem,
            quantity: qty,
            unit: newItem.unit || newItem.variantName || "",
            variantName: newItem.variantName || newItem.unit || "",
          };
          if (typeof window !== "undefined") {
            trackAddToCart({
              value: newItem.price * qty,
              items: [analyticsItemFromCartItem(trackedItem)],
            });
          }
          return {
            items: mergeCartItems([...state.items, { ...trackedItem, quantity: qty }]),
          };
        }),

      removeItem: (lineId) =>
        set((s) => {
          const removed = s.items.find((i) => i.id === lineId);
          if (removed && typeof window !== "undefined") {
            trackRemoveFromCart({
              value: removed.price * removed.quantity,
              items: [analyticsItemFromCartItem(removed, s.coupon?.code ?? undefined)],
            });
          }
          return { items: s.items.filter((i) => i.id !== lineId) };
        }),

      updateQuantity: (lineId, qty) =>
        set((s) => ({
          items:
            qty < CART_MIN_QUANTITY
              ? s.items.filter((i) => i.id !== lineId)
              : s.items.map((i) =>
                  i.id === lineId ? { ...i, quantity: clampCartQuantity(qty) } : i,
                ),
        })),

      updateQty: (lineId, qty) => get().updateQuantity(lineId, qty),

      clearCart: () => set({ items: [], coupon: null }),

      applyCoupon: (coupon) =>
        set((state) => {
          const normalized = {
            ...coupon,
            discountType: couponType(coupon),
            discountValue: couponValue(coupon),
            type: couponType(coupon),
            value: couponValue(coupon),
          };
          if (typeof window !== "undefined") {
            trackCouponApplied({
              coupon: normalized.code,
              value: normalized.savings,
              items: state.items.map((item) => analyticsItemFromCartItem(item, normalized.code)),
            });
          }
          return { coupon: normalized };
        }),

      removeCoupon: () => set({ coupon: null }),

      replaceItems: (items) => set({ items: mergeCartItems(items) }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      discount: () => {
        const { coupon } = get();
        if (!coupon) return 0;
        const sub = get().subtotal();
        const raw =
          couponType(coupon) === "percent"
            ? Math.round((sub * couponValue(coupon)) / 100)
            : couponValue(coupon);
        return Math.min(sub, Math.max(0, raw));
      },

      gstAmount: () =>
        get().items.reduce((sum, i) => {
          const lineTotal = i.price * i.quantity;
          return sum + gstFromInclusiveLine(lineTotal, i.gstRate);
        }, 0),

      gst: () => get().gstAmount(),

      shippingCharge: () => {
        const { coupon } = get();
        if (coupon?.freeShipping) return 0;
        const sub = get().subtotal() - get().discount();
        return sub >= 999 ? 0 : 49;
      },

      shipping: () => get().shippingCharge(),

      total: () => {
        const { subtotal, discount, shippingCharge } = get();
        return subtotal() - discount() + shippingCharge();
      },
    }),
    {
      name: "bbc-cart",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state?.items?.length) return;
        const merged = mergeCartItems(state.items);
        const changed =
          merged.length !== state.items.length ||
          merged.some((item, i) => {
            const prev = state.items[i];
            return (
              !prev ||
              item.unit !== prev.unit ||
              item.variantId !== prev.variantId ||
              item.quantity !== prev.quantity
            );
          });
        if (changed) {
          useCartStore.setState({ items: merged });
        }
      },
    },
  ),
);
