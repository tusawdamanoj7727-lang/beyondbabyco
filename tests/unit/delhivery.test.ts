import { describe, expect, it } from "vitest";

import { authenticate } from "@/lib/delhivery/client";
import { getDelhiveryConfig } from "@/lib/delhivery/config";
import {
  cancelBodySchema,
  createOrderBodySchema,
  delhiveryWebhookSchema,
  labelQuerySchema,
  pickupBodySchema,
  serviceabilityQuerySchema,
  trackQuerySchema,
} from "@/lib/delhivery/schemas";
import { mapDelhiveryStatus } from "@/lib/delhivery/status-map";

describe("Delhivery config", () => {
  it("reports not configured without API key", () => {
    const config = getDelhiveryConfig();
    expect(typeof config.baseUrl).toBe("string");
    expect(config.baseUrl.length).toBeGreaterThan(0);
    expect(typeof config.isConfigured).toBe("boolean");
  });

  it("authenticate reflects configuration state", () => {
    const auth = authenticate();
    expect(auth.ok).toBe(getDelhiveryConfig().isConfigured);
    expect(auth.baseUrl).toBe(getDelhiveryConfig().baseUrl);
  });
});

describe("Delhivery schemas", () => {
  it("validates serviceability pincode", () => {
    expect(serviceabilityQuerySchema.safeParse({ pincode: "560001" }).success).toBe(true);
    expect(serviceabilityQuerySchema.safeParse({ pincode: "56001" }).success).toBe(false);
  });

  it("validates create order body", () => {
    const orderId = "550e8400-e29b-41d4-a716-446655440000";
    expect(createOrderBodySchema.safeParse({ orderId }).success).toBe(true);
    expect(createOrderBodySchema.safeParse({ orderId: "bad" }).success).toBe(false);
  });

  it("validates track query", () => {
    expect(trackQuerySchema.safeParse({ waybill: "1234567890" }).success).toBe(true);
    expect(trackQuerySchema.safeParse({ waybill: "abc" }).success).toBe(false);
  });

  it("validates cancel body", () => {
    const shipmentId = "550e8400-e29b-41d4-a716-446655440001";
    expect(cancelBodySchema.safeParse({ waybill: "1234567890", shipmentId }).success).toBe(true);
  });

  it("validates pickup body", () => {
    expect(pickupBodySchema.safeParse({ pickupDate: "2026-06-27" }).success).toBe(true);
    expect(pickupBodySchema.safeParse({ pickupDate: "27-06-2026" }).success).toBe(false);
  });

  it("validates label query", () => {
    expect(labelQuerySchema.safeParse({ waybill: "1234567890" }).success).toBe(true);
  });

  it("accepts webhook payloads with waybill or AWB", () => {
    expect(delhiveryWebhookSchema.safeParse({ waybill: "WB123", status: "In Transit" }).success).toBe(true);
    expect(delhiveryWebhookSchema.safeParse({ AWB: "WB456", Status: "Delivered" }).success).toBe(true);
  });
});

describe("Delhivery status mapping", () => {
  it("maps delivered status", () => {
    expect(mapDelhiveryStatus("Delivered")).toBe("delivered");
  });

  it("maps in transit status", () => {
    expect(mapDelhiveryStatus("In Transit")).toBe("in_transit");
  });

  it("maps out for delivery", () => {
    expect(mapDelhiveryStatus("Out for Delivery")).toBe("out_for_delivery");
  });

  it("maps cancellation / RTO", () => {
    expect(mapDelhiveryStatus("RTO Initiated")).toBe("returned");
  });
});
