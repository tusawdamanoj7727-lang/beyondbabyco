import { describe, expect, it } from "vitest";

import {
  canResumeRazorpayCheckout,
  razorpayInitFailureCleanup,
  shouldSendOAuthWelcomeEmail,
} from "@/lib/checkout/commerce-stability";
import { evaluateCouponPreview, type CouponPreviewRow } from "@/lib/storefront/apply-coupon-preview";
import {
  cartLineKey,
  mergeGuestCartIntoServer,
  type CartItem,
} from "@/lib/storefront/cart-types";

function line(
  overrides: Partial<CartItem> & Pick<CartItem, "productId" | "variantId" | "quantity">,
): CartItem {
  return {
    productId: overrides.productId,
    variantId: overrides.variantId,
    quantity: overrides.quantity,
    addedAt: overrides.addedAt ?? Date.now(),
    name: overrides.name ?? "Item",
    slug: overrides.slug ?? "item",
    price: overrides.price ?? 399,
    compareAtPrice: overrides.compareAtPrice ?? null,
    variantName: overrides.variantName ?? "Default",
    imageUrl: overrides.imageUrl ?? null,
    categoryId: null,
    brandId: null,
    stock: overrides.stock ?? 10,
    inStock: overrides.inStock ?? true,
    gstRate: overrides.gstRate ?? 12,
  };
}

function coupon(partial: Partial<CouponPreviewRow> & Pick<CouponPreviewRow, "code" | "type">): CouponPreviewRow {
  return {
    id: partial.id ?? "c1",
    code: partial.code,
    type: partial.type,
    promo_type: partial.promo_type ?? null,
    value: partial.value ?? 0,
    min_order: partial.min_order ?? 0,
    max_uses: partial.max_uses ?? null,
    used_count: partial.used_count ?? 0,
    starts_at: partial.starts_at ?? null,
    expires_at: partial.expires_at ?? null,
    is_active: partial.is_active ?? true,
    lifecycle_status: partial.lifecycle_status ?? "active",
    deleted_at: partial.deleted_at ?? null,
    max_discount: partial.max_discount ?? null,
    description: partial.description ?? null,
  };
}

describe("Razorpay init failure cleanup", () => {
  it("cancels order and marks payment failed when Razorpay create fails", () => {
    const plan = razorpayInitFailureCleanup();
    expect(plan.orderStatus).toBe("cancelled");
    expect(plan.paymentStatus).toBe("failed");
    expect(plan.releaseStock).toBe(true);
    expect(plan.releaseCoupon).toBe(true);
  });

  it("blocks resume/pay for cancelled orders after inventory was released", () => {
    expect(canResumeRazorpayCheckout("pending")).toBe(true);
    expect(canResumeRazorpayCheckout("cancelled")).toBe(false);
    expect(canResumeRazorpayCheckout("refunded")).toBe(false);
  });
});

describe("Guest cart merge by product + variant", () => {
  it("keeps guest variant A and account variant B as separate lines", () => {
    const remote = [line({ productId: "oil", variantId: "v-b", quantity: 1, name: "Oil B" })];
    const local = [line({ productId: "oil", variantId: "v-a", quantity: 2, name: "Oil A" })];
    const merged = mergeGuestCartIntoServer(local, remote);
    expect(merged).toHaveLength(2);
    expect(merged.map((i) => cartLineKey(i.productId, i.variantId)).sort()).toEqual([
      "oil:v-a",
      "oil:v-b",
    ]);
  });

  it("merges quantity for identical product+variant", () => {
    const remote = [line({ productId: "wash", variantId: "v1", quantity: 1 })];
    const local = [line({ productId: "wash", variantId: "v1", quantity: 2 })];
    const merged = mergeGuestCartIntoServer(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.quantity).toBe(3);
  });

  it("preserves guest and account bundle lines with distinct products", () => {
    const remote = [
      line({ productId: "wash", variantId: "default", quantity: 1 }),
      line({ productId: "shampoo", variantId: "default", quantity: 1 }),
    ];
    const local = [
      line({ productId: "lotion", variantId: "default", quantity: 1 }),
      line({ productId: "wash", variantId: "default", quantity: 1 }),
    ];
    const merged = mergeGuestCartIntoServer(local, remote);
    expect(merged).toHaveLength(3);
    expect(merged.find((i) => i.productId === "wash")!.quantity).toBe(2);
    expect(merged.some((i) => i.productId === "lotion")).toBe(true);
  });
});

describe("Free shipping coupon UI preview", () => {
  it("accepts free_shipping promo when product savings are zero", () => {
    const result = evaluateCouponPreview(
      coupon({ code: "FREESHIP", type: "flat", promo_type: "free_shipping", value: 0 }),
      500,
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.freeShipping).toBe(true);
      expect(result.savings).toBe(0);
    }
  });

  it("still rejects zero-savings non-shipping coupons", () => {
    const result = evaluateCouponPreview(coupon({ code: "ZERO", type: "flat", value: 0 }), 500);
    expect(result.valid).toBe(false);
  });

  it("still applies percent discounts normally", () => {
    const result = evaluateCouponPreview(
      coupon({ code: "BABY15", type: "percent", value: 15 }),
      1000,
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.savings).toBe(150);
      expect(result.freeShipping).toBe(false);
    }
  });
});

describe("OAuth first-login welcome email", () => {
  it("sends welcome only when no existing customer for profile", () => {
    expect(shouldSendOAuthWelcomeEmail(false)).toBe(true);
    expect(shouldSendOAuthWelcomeEmail(true)).toBe(false);
  });
});
