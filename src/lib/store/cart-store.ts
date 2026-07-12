import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { gstFromInclusiveLine } from "@/lib/catalog/gst-rates";
import { clampCartQuantity, CART_MIN_QUANTITY } from "@/lib/storefront/cart-types";

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
  /** Compatibility aliases for simpler coupon payloads. */
  type?: "percent" | "flat";
  value?: number;
}

interface CartStore {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  updateQty: (variantId: string, quantity: number) => void;
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
          const exists = state.items.find((i) => i.variantId === newItem.variantId);
          if (exists) {
            return {
              items: state.items.map((i) =>
                i.variantId === newItem.variantId
                  ? { ...i, quantity: clampCartQuantity(i.quantity + qty) }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...newItem, quantity: qty }] };
        }),

      removeItem: (variantId) =>
        set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),

      updateQuantity: (variantId, qty) =>
        set((s) => ({
          items:
            qty < CART_MIN_QUANTITY
              ? s.items.filter((i) => i.variantId !== variantId)
              : s.items.map((i) =>
                  i.variantId === variantId ? { ...i, quantity: clampCartQuantity(qty) } : i,
                ),
        })),

      updateQty: (variantId, qty) => get().updateQuantity(variantId, qty),

      clearCart: () => set({ items: [], coupon: null }),

      applyCoupon: (coupon) =>
        set({
          coupon: {
            ...coupon,
            discountType: couponType(coupon),
            discountValue: couponValue(coupon),
            type: couponType(coupon),
            value: couponValue(coupon),
          },
        }),

      removeCoupon: () => set({ coupon: null }),

      replaceItems: (items) =>
        set({
          items: items.map((item) => ({
            ...item,
            quantity: clampCartQuantity(item.quantity),
          })),
        }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      discount: () => {
        const { coupon } = get();
        if (!coupon) return 0;
        return couponType(coupon) === "percent"
          ? Math.round((get().subtotal() * couponValue(coupon)) / 100)
          : couponValue(coupon);
      },

      gstAmount: () =>
        get().items.reduce((sum, i) => {
          const lineTotal = i.price * i.quantity;
          return sum + gstFromInclusiveLine(lineTotal, i.gstRate);
        }, 0),

      gst: () => get().gstAmount(),

      shippingCharge: () => {
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
        const normalized = state.items.map((item) => {
          const unit = item.unit || item.variantName || "";
          return { ...item, unit, variantName: item.variantName || unit };
        });
        if (normalized.some((item, i) => item.unit !== state.items[i]?.unit)) {
          useCartStore.setState({ items: normalized });
        }
      },
    },
  ),
);
