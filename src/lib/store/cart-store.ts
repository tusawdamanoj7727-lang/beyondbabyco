import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { gstFromInclusiveLine } from "@/lib/catalog/gst-rates";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
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
}

interface CartStore {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  replaceItems: (items: CartItem[]) => void;
  // Computed
  itemCount: () => number;
  subtotal: () => number;
  discount: () => number;
  gstAmount: () => number;
  shippingCharge: () => number;
  total: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (newItem) =>
        set((state) => {
          const exists = state.items.find((i) => i.variantId === newItem.variantId);
          if (exists) {
            return {
              items: state.items.map((i) =>
                i.variantId === newItem.variantId
                  ? { ...i, quantity: Math.min(i.quantity + 1, 10) }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...newItem, quantity: 1 }] };
        }),

      removeItem: (variantId) =>
        set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),

      updateQuantity: (variantId, qty) =>
        set((s) => ({
          items:
            qty < 1
              ? s.items.filter((i) => i.variantId !== variantId)
              : s.items.map((i) =>
                  i.variantId === variantId ? { ...i, quantity: Math.min(qty, 10) } : i,
                ),
        })),

      clearCart: () => set({ items: [], coupon: null }),

      applyCoupon: (coupon) => set({ coupon }),

      removeCoupon: () => set({ coupon: null }),

      replaceItems: (items) => set({ items }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      discount: () => {
        const { coupon } = get();
        if (!coupon) return 0;
        return coupon.discountType === "percent"
          ? Math.round((get().subtotal() * coupon.discountValue) / 100)
          : coupon.discountValue;
      },

      gstAmount: () =>
        get().items.reduce((sum, i) => {
          const lineTotal = i.price * i.quantity;
          return sum + gstFromInclusiveLine(lineTotal, i.gstRate);
        }, 0),

      shippingCharge: () => {
        const sub = get().subtotal() - get().discount();
        return sub >= 999 ? 0 : 49;
      },

      total: () => {
        const { subtotal, discount, shippingCharge } = get();
        return subtotal() - discount() + shippingCharge();
      },
    }),
    {
      name: "beyondbabyco-cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
