import { describe, expect, it } from "vitest";

import {
  verifyRazorpayWebhookSignature,
  decodeGatewaySecret,
  resolveRazorpayWebhookSecret,
} from "@/lib/admin/gateway-adapters/razorpay";
import { createHmac } from "node:crypto";
import { selfTestRazorpayWebhookVerification } from "@/lib/operations/readiness";

describe("Razorpay webhook verification", () => {
  const secret = "whsec_test_secret_123";
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_123" } } } });

  function sign(raw: string) {
    return createHmac("sha256", secret).update(raw).digest("hex");
  }

  it("accepts valid HMAC SHA256 signature", () => {
    const signature = sign(body);
    expect(verifyRazorpayWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("rejects invalid signature", () => {
    expect(verifyRazorpayWebhookSignature(body, "invalid", secret)).toBe(false);
  });

  it("rejects tampered body", () => {
    const signature = sign(body);
    expect(verifyRazorpayWebhookSignature(body + " ", signature, secret)).toBe(false);
  });

  it("rejects missing secret", () => {
    expect(verifyRazorpayWebhookSignature(body, sign(body), null)).toBe(false);
  });

  it("decodes enc: prefixed secrets", () => {
    expect(decodeGatewaySecret("enc:mysecret")).toBe("mysecret");
  });

  it("self-test helper passes", () => {
    expect(selfTestRazorpayWebhookVerification("test-secret")).toBe(true);
  });

  it("resolveRazorpayWebhookSecret falls back to env", () => {
    const prev = process.env.RAZORPAY_WEBHOOK_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = "env-secret";
    expect(resolveRazorpayWebhookSecret(null)).toBe("env-secret");
    if (prev) process.env.RAZORPAY_WEBHOOK_SECRET = prev;
    else delete process.env.RAZORPAY_WEBHOOK_SECRET;
  });
});

describe("analytics events", () => {
  it("exports client event helpers", async () => {
    const mod = await import("@/lib/analytics/events");
    expect(typeof mod.trackPageView).toBe("function");
    expect(typeof mod.trackPurchase).toBe("function");
    expect(typeof mod.trackBeginCheckout).toBe("function");
  });
});
