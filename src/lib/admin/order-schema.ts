import { z } from "zod";

import type { OrderStatus, PaymentStatus } from "@/lib/supabase/database.types";

const optionalText = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .nullable()
  .transform((v) => (v && v.length ? v : null));

export const orderItemInputSchema = z.object({
  product_variant_id: z.string().uuid().nullable(),
  product_id: z.string().uuid().nullable(),
  name: z.string().trim().min(1),
  sku: optionalText,
  unit_price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  tax_rate: z.number().nonnegative().default(0),
});

export const createOrderSchema = z.object({
  customer_id: z.string().uuid().nullable(),
  warehouse_id: z.string().uuid().nullable(),
  shipping_method_id: z.string().uuid().nullable(),
  status: z.enum(["draft", "pending"] as const).default("draft"),
  notes: optionalText,
  internal_notes: optionalText,
  items: z.array(orderItemInputSchema).min(1, "Add at least one line item"),
  shipping_address: z.object({
    full_name: z.string().trim().min(1),
    phone: optionalText,
    line1: z.string().trim().min(1),
    line2: optionalText,
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    country: z.string().trim().default("India"),
    pincode: z.string().trim().min(1),
  }),
  shipping_total: z.number().nonnegative().default(0),
  discount_total: z.number().nonnegative().default(0),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = createOrderSchema.partial().extend({
  id: z.string().uuid(),
});

export const refundSchema = z.object({
  order_id: z.string().uuid(),
  amount: z.number().positive(),
  reason: optionalText,
  notes: optionalText,
  full: z.boolean().default(false),
});

export const shipmentInputSchema = z.object({
  order_id: z.string().uuid(),
  warehouse_id: z.string().uuid().nullable(),
  shipping_method_id: z.string().uuid().nullable(),
  carrier: optionalText,
  tracking_number: optionalText,
  weight_grams: z.number().int().nonnegative().optional().nullable(),
  dimensions: z
    .object({ length: z.number().optional(), width: z.number().optional(), height: z.number().optional() })
    .optional()
    .nullable(),
  estimated_delivery: optionalText,
});

export type ShipmentInput = z.infer<typeof shipmentInputSchema>;

export const trackingEventSchema = z.object({
  shipment_id: z.string().uuid(),
  status: z.enum([
    "pending",
    "label_created",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "failed",
    "returned",
  ] as const),
  message: optionalText,
  location: optionalText,
});

export function generateOrderNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ORD-${y}${m}${day}-${rand}`;
}

export function fieldErrorsFrom(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function calcLineTotal(unitPrice: number, quantity: number, taxRate: number): number {
  const base = unitPrice * quantity;
  return Math.round((base + base * (taxRate / 100)) * 100) / 100;
}

export function calcOrderTotals(items: { total: number }[], shipping: number, discount: number) {
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxTotal = 0;
  const grandTotal = Math.max(0, subtotal + shipping - discount);
  return { subtotal, taxTotal, shippingTotal: shipping, discountTotal: discount, grandTotal };
}

export type { OrderStatus, PaymentStatus };
