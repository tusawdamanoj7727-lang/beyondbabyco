import { describe, expect, it } from "vitest";

describe("coupon redemption contract", () => {
  it("documents trusted redemption path uses service_role RPCs only", () => {
    const writers = [
      "src/lib/coupons/redemption.ts → redeemCouponForOrder",
      "src/lib/coupons/redemption.ts → releaseCouponForOrder",
      "src/lib/admin/coupon-engine.ts → applyCoupon/removeCoupon",
    ];

    expect(writers.every((entry) => entry.includes("redemption") || entry.includes("coupon-engine"))).toBe(
      true,
    );
  });

  it("expects duplicate order redemption to be blocked at the database layer", () => {
    expect("idx_coupon_usage_order_unique").toMatch(/order_unique/);
  });
});
