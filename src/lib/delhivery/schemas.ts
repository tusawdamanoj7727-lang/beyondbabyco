import { z } from "zod";

export const pincodeSchema = z.string().regex(/^\d{6}$/, "Pincode must be 6 digits");

export const serviceabilityQuerySchema = z.object({
  pincode: pincodeSchema,
});

export const createOrderBodySchema = z.object({
  orderId: z.string().uuid(),
  shipmentId: z.string().uuid().optional(),
  waybill: z.string().optional(),
  weightGrams: z.number().int().positive().optional(),
  codAmount: z.number().nonnegative().optional(),
  paymentMode: z.enum(["Prepaid", "COD"]).optional(),
});

export const trackQuerySchema = z.object({
  waybill: z.string().min(4),
  shipmentId: z.string().uuid().optional(),
});

export const cancelBodySchema = z.object({
  waybill: z.string().min(4),
  shipmentId: z.string().uuid(),
});

export const pickupBodySchema = z.object({
  shipmentId: z.string().uuid().optional(),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pickupTime: z.string().default("11:00:00"),
  expectedPackageCount: z.number().int().positive().default(1),
  pickupLocation: z.string().optional(),
});

export const labelQuerySchema = z.object({
  waybill: z.string().min(4),
  shipmentId: z.string().uuid().optional(),
});

export const delhiveryWebhookSchema = z.object({
  waybill: z.string().optional(),
  AWB: z.string().optional(),
  status: z.string().optional(),
  Status: z.string().optional(),
  location: z.string().optional(),
  scan_date_time: z.string().optional(),
  order_id: z.string().optional(),
}).passthrough();

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
export type TrackQuery = z.infer<typeof trackQuerySchema>;
export type CancelBody = z.infer<typeof cancelBodySchema>;
export type PickupBody = z.infer<typeof pickupBodySchema>;
