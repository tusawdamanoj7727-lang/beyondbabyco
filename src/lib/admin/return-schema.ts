import { z } from "zod";

import { RETURN_REASONS, RETURN_STATUSES, REFUND_TYPES, RESTOCK_DECISIONS, DAMAGE_LEVELS } from "./return-types";

const optionalText = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .nullable()
  .transform((v) => (v && v.length ? v : null));

export const createReturnSchema = z.object({
  order_id: z.string().uuid(),
  warehouse_id: z.string().uuid().nullable(),
  reason: z.enum(RETURN_REASONS),
  notes: optionalText,
  items: z
    .array(
      z.object({
        order_item_id: z.string().uuid().nullable(),
        product_id: z.string().uuid().nullable(),
        product_variant_id: z.string().uuid().nullable(),
        name: z.string().trim().min(1),
        sku: optionalText,
        quantity: z.number().int().positive(),
        unit_price: z.number().nonnegative(),
      }),
    )
    .min(1),
});

export const inspectionSchema = z.object({
  return_id: z.string().uuid(),
  item_id: z.string().uuid(),
  condition: optionalText,
  restock_decision: z.enum(RESTOCK_DECISIONS).nullable(),
  damage_level: z.enum(DAMAGE_LEVELS).nullable(),
  inspector_notes: optionalText,
  inspection_photos: z.array(z.string().url()).default([]),
});

export const refundSchema = z.object({
  return_id: z.string().uuid(),
  refund_type: z.enum(REFUND_TYPES),
  amount: z.number().nonnegative(),
  notes: optionalText,
});

export const statusChangeSchema = z.object({
  return_id: z.string().uuid(),
  status: z.enum(RETURN_STATUSES),
  reason: optionalText,
});

export const bulkReturnIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  reason: optionalText,
});

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
