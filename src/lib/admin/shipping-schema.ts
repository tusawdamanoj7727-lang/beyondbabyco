import { z } from "zod";

import { CARRIER_PROVIDERS, NDR_REASONS, NDR_STATUSES } from "./shipping-types";

const optionalText = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .nullable()
  .transform((v) => (v && v.length ? v : null));

export const carrierInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  provider: z.enum(CARRIER_PROVIDERS),
  api_key: optionalText,
  api_secret: optionalText,
  sandbox: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

export const zoneInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  country: z.string().trim().min(1).default("India"),
  state: optionalText,
  city: optionalText,
  postal_from: optionalText,
  postal_to: optionalText,
  priority: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const rateInputSchema = z.object({
  zone_id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  weight_min_grams: z.number().int().nonnegative().default(0),
  weight_max_grams: z.number().int().positive().nullable().optional(),
  price: z.number().nonnegative(),
  free_shipping_threshold: z.number().nonnegative().nullable().optional(),
  cod_charge: z.number().nonnegative().default(0),
  is_active: z.boolean().default(true),
});

export const pickupInputSchema = z.object({
  carrier_id: z.string().uuid().nullable().optional(),
  warehouse_id: z.string().uuid().nullable().optional(),
  pickup_date: z.string().min(1),
  notes: optionalText,
});

export const ndrInputSchema = z.object({
  shipment_id: z.string().uuid(),
  reason: z.enum(NDR_REASONS),
  notes: optionalText,
  scheduled_at: z.string().nullable().optional(),
});

export const ndrResolveSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(NDR_STATUSES),
  notes: optionalText,
});

export const bulkIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
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
