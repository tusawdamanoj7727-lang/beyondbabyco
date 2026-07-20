/**
 * Pure helpers for checkout / auth release-blocker behavior (unit-testable).
 */

/** Orders in these statuses must never resume Razorpay checkout. */
export const NON_PAYABLE_ORDER_STATUSES = ["cancelled", "refunded", "returned", "completed"] as const;

export function canResumeRazorpayCheckout(orderStatus: string): boolean {
  return !(NON_PAYABLE_ORDER_STATUSES as readonly string[]).includes(orderStatus);
}

/** Plan applied when createRazorpayOrder fails after a pending order was created. */
export function razorpayInitFailureCleanup() {
  return {
    orderStatus: "cancelled" as const,
    paymentStatus: "failed" as const,
    releaseStock: true,
    releaseCoupon: true,
  };
}

/** Send welcome only on first OAuth account link (no prior customer for this profile). */
export function shouldSendOAuthWelcomeEmail(hadExistingCustomerForProfile: boolean): boolean {
  return !hadExistingCustomerForProfile;
}
