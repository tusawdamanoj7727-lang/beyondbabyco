import { z } from "zod";

import { ADJUSTMENT_REASONS, WAREHOUSE_STATUSES } from "./inventory-types";

const optionalText = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));

const warehouseCodeRegex = /^[A-Z0-9_-]{2,20}$/;

export const warehouseInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  code: z
    .string()
    .trim()
    .min(2, "Code is required")
    .max(20)
    .regex(warehouseCodeRegex, "Use 2–20 uppercase letters, numbers, _ or -"),
  address: optionalText,
  city: optionalText,
  state: optionalText,
  country: z.string().trim().min(1).max(80).default("India"),
  pincode: optionalText,
  contact_person: optionalText,
  phone: optionalText,
  email: z.string().trim().email("Enter a valid email").optional().nullable().or(z.literal("")).transform((v) => (v && v.length ? v : null)),
  status: z.enum(WAREHOUSE_STATUSES).default("active"),
  is_default: z.boolean().default(false),
});

export type WarehouseInput = z.infer<typeof warehouseInputSchema>;

export const supplierInputSchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(160),
  contact_name: optionalText,
  email: z.string().trim().email("Enter a valid email").optional().nullable().or(z.literal("")).transform((v) => (v && v.length ? v : null)),
  phone: optionalText,
  gstin: optionalText,
  address: optionalText,
  country: z.string().trim().min(1).max(80).default("India"),
  website: optionalText,
  notes: optionalText,
  is_active: z.boolean().default(true),
});

export type SupplierInput = z.infer<typeof supplierInputSchema>;

export const adjustStockSchema = z.object({
  inventory_id: z.string().uuid(),
  direction: z.enum(["increase", "decrease"]),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  reason: z.enum(ADJUSTMENT_REASONS),
  note: optionalText,
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

export const poItemSchema = z.object({
  product_variant_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit_cost: z.number().nonnegative(),
});

export const purchaseOrderInputSchema = z.object({
  supplier_id: z.string().uuid().nullable(),
  warehouse_id: z.string().uuid().nullable(),
  expected_at: optionalText,
  notes: optionalText,
  items: z.array(poItemSchema).min(1, "Add at least one line item"),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderInputSchema>;

export const receiveGoodsSchema = z.object({
  purchase_order_id: z.string().uuid(),
  lines: z.array(
    z.object({
      item_id: z.string().uuid(),
      quantity: z.number().int().nonnegative(),
    }),
  ),
});

export type ReceiveGoodsInput = z.infer<typeof receiveGoodsSchema>;

export function generatePoNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PO-${y}${m}${day}-${rand}`;
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
