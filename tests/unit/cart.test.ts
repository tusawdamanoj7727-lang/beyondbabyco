import { beforeEach, describe, expect, it } from "vitest";

import { useCartStore, type CartItem } from "@/lib/store/cart-store";
import {
  estimateShippingFee,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from "@/lib/storefront/shipping";
import { calculateGST, calculateGSTFromCart, SELLER_STATE } from "@/lib/utils/gst";

/** Mirrors storefront coupon min-order rule (see 028_coupon_validation_seed.sql — BABY15). */
function passesCouponMinOrder(cartTotal: number, minOrder: number): boolean {
  return cartTotal >= minOrder;
}

function makeItem(overrides: Partial<CartItem> & Pick<CartItem, "variantId" | "price">): CartItem {
  return {
    id: overrides.variantId,
    productId: overrides.productId ?? "product-1",
    variantId: overrides.variantId,
    name: overrides.name ?? "Test product",
    variantName: overrides.variantName ?? "Default",
    price: overrides.price,
    originalPrice: overrides.originalPrice ?? overrides.price,
    quantity: overrides.quantity ?? 1,
    image: overrides.image ?? "/images/test.webp",
    slug: overrides.slug ?? "test-product",
    gstRate: overrides.gstRate ?? 12,
  };
}

function resetCart() {
  useCartStore.setState({ items: [], coupon: null });
}

describe("Cart calculations", () => {
  beforeEach(() => {
    resetCart();
  });

  it("correctly calculates subtotal for multiple items", () => {
    useCartStore.setState({
      items: [
        makeItem({ variantId: "v-wipes", price: 299, quantity: 2 }),
        makeItem({ variantId: "v-oil", price: 499, quantity: 1 }),
      ],
    });

    expect(useCartStore.getState().subtotal()).toBe(1097);
  });

  it("applies percentage coupon correctly", () => {
    useCartStore.setState({
      items: [makeItem({ variantId: "v-1", price: 1000, quantity: 1 })],
      coupon: {
        code: "WELCOME10",
        discountType: "percent",
        discountValue: 10,
        savings: 100,
      },
    });

    const { subtotal, discount } = useCartStore.getState();
    expect(subtotal()).toBe(1000);
    expect(discount()).toBe(100);
    expect(subtotal() - discount()).toBe(900);
  });

  it("applies flat discount coupon correctly", () => {
    useCartStore.setState({
      items: [makeItem({ variantId: "v-1", price: 599, quantity: 1 })],
      coupon: {
        code: "FLAT100",
        discountType: "flat",
        discountValue: 100,
        savings: 100,
      },
    });

    const { subtotal, discount } = useCartStore.getState();
    expect(subtotal()).toBe(599);
    expect(discount()).toBe(100);
    expect(subtotal() - discount()).toBe(499);
  });

  it("enforces minimum order for coupon", () => {
    const baby15MinOrder = 499;
    const cartTotal = 400;

    expect(passesCouponMinOrder(cartTotal, baby15MinOrder)).toBe(false);
    expect(passesCouponMinOrder(499, baby15MinOrder)).toBe(true);
    expect(passesCouponMinOrder(500, baby15MinOrder)).toBe(true);
  });

  it("calculates free shipping threshold correctly", () => {
    expect(estimateShippingFee(998)).toBe(STANDARD_SHIPPING_FEE);
    expect(estimateShippingFee(999)).toBe(0);
    expect(FREE_SHIPPING_THRESHOLD).toBe(999);

    useCartStore.setState({
      items: [makeItem({ variantId: "v-1", price: 998, quantity: 1 })],
    });
    expect(useCartStore.getState().shippingCharge()).toBe(49);

    useCartStore.setState({
      items: [makeItem({ variantId: "v-1", price: 999, quantity: 1 })],
    });
    expect(useCartStore.getState().shippingCharge()).toBe(0);
  });

  it("extracts inclusive GST per item rate in cart store", () => {
    useCartStore.setState({
      items: [makeItem({ variantId: "v-1", price: 112, quantity: 1, gstRate: 12 })],
    });

    expect(useCartStore.getState().gstAmount()).toBe(12);
    expect(useCartStore.getState().total()).toBe(112 + 49);
  });

  it("calculates GST correctly for baby products (12%, MRP inclusive)", () => {
    const breakdown = calculateGST(
      [{ price: 112, quantity: 1, gstRate: 12 }],
      SELLER_STATE,
    );

    expect(breakdown.total).toBe(12);
    expect(breakdown.cgst).toBe(6);
    expect(breakdown.sgst).toBe(6);
    expect(breakdown.igst).toBe(0);
    expect(breakdown.isIntrastate).toBe(true);
  });

  it("calculates IGST correctly for interstate order", () => {
    const breakdown = calculateGST(
      [{ price: 118, quantity: 1, gstRate: 18 }],
      "Maharashtra",
    );

    expect(breakdown.isIntrastate).toBe(false);
    expect(breakdown.igst).toBe(18);
    expect(breakdown.cgst).toBe(0);
    expect(breakdown.sgst).toBe(0);
    expect(breakdown.total).toBe(18);
  });

  it("calculates CGST+SGST for Rajasthan intrastate order", () => {
    const breakdown = calculateGST(
      [{ price: 118, quantity: 1, gstRate: 18 }],
      SELLER_STATE,
    );

    expect(breakdown.isIntrastate).toBe(true);
    expect(breakdown.cgst).toBe(9);
    expect(breakdown.sgst).toBe(9);
    expect(breakdown.igst).toBe(0);
    expect(breakdown.total).toBe(18);
  });

  it("prevents quantity below 1", () => {
    useCartStore.setState({
      items: [makeItem({ variantId: "v-1", price: 299, quantity: 2 })],
    });

    useCartStore.getState().updateQuantity("v-1", 0);

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("prevents quantity above 10", () => {
    useCartStore.setState({
      items: [makeItem({ variantId: "v-1", price: 299, quantity: 1 })],
    });

    useCartStore.getState().updateQuantity("v-1", 11);

    expect(useCartStore.getState().items[0]?.quantity).toBe(10);
  });

  it("applies coupon discount before GST in checkout GST helper", () => {
    const items = [{ price: 1180, quantity: 1, gstRate: 18 }];
    const withDiscount = calculateGSTFromCart(items, SELLER_STATE, 180);

    expect(withDiscount.cgst).toBe(76.27);
    expect(withDiscount.sgst).toBe(76.27);
    expect(withDiscount.total).toBe(152.54);
  });
});
