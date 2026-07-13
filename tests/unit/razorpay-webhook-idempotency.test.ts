import { describe, expect, it } from "vitest";

import {
  RAZORPAY_CAPTURE_COMPLETED_LOG,
  RAZORPAY_WEBHOOK_RECEIVED_LOG,
  isRazorpayCaptureEvent,
} from "@/lib/admin/razorpay-webhook-idempotency";

describe("Razorpay webhook idempotency", () => {
  it("identifies capture events", () => {
    expect(isRazorpayCaptureEvent("payment.captured")).toBe(true);
    expect(isRazorpayCaptureEvent("order.paid")).toBe(true);
    expect(isRazorpayCaptureEvent("payment.failed")).toBe(false);
  });

  it("uses distinct log messages for received vs completed", () => {
    expect(RAZORPAY_WEBHOOK_RECEIVED_LOG).not.toBe(RAZORPAY_CAPTURE_COMPLETED_LOG);
    expect(RAZORPAY_CAPTURE_COMPLETED_LOG).toContain("capture completed");
  });
});
