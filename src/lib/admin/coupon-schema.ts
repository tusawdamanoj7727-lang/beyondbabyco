import { z } from "zod";

import { COUPON_LIFECYCLE, COUPON_TYPES } from "./coupon-types";

const optionalText = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .nullable()
  .transform((v) => (v && v.length ? v : null));

const uuidList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => {
    if (Array.isArray(v)) return v.filter(Boolean);
    return (v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  });

export const couponInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  code: z.string().trim().min(2, "Code is required.").max(50).toUpperCase(),
  description: optionalText,
  promo_type: z.enum(COUPON_TYPES),
  value: z.number().nonnegative(),
  min_order: z.number().nonnegative().default(0),
  max_discount: z.number().nonnegative().nullable().optional(),
  max_uses: z.number().int().nonnegative().nullable().optional(),
  per_customer_limit: z.number().int().nonnegative().nullable().optional(),
  first_order_only: z.boolean().default(false),
  logged_in_only: z.boolean().default(false),
  timezone: z.string().trim().min(1).default("Asia/Kolkata"),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  lifecycle_status: z.enum(COUPON_LIFECYCLE).default("draft"),
  is_active: z.boolean().default(true),
  product_ids: uuidList,
  category_ids: uuidList,
  brand_ids: uuidList,
  segments: uuidList,
  customer_ids: uuidList,
  exclude_product_ids: uuidList,
  exclude_category_ids: uuidList,
  allow_stack: z.boolean().default(false),
  priority: z.number().int().default(0),
  is_exclusive: z.boolean().default(false),
  auto_apply: z.boolean().default(false),
  buy_quantity: z.number().int().positive().nullable().optional(),
  buy_product_id: z.string().uuid().nullable().optional(),
  buy_category_id: z.string().uuid().nullable().optional(),
  get_quantity: z.number().int().positive().nullable().optional(),
  get_product_id: z.string().uuid().nullable().optional(),
  bxgy_discount: z.number().nonnegative().nullable().optional(),
  fs_min_cart: z.number().nonnegative().nullable().optional(),
  fs_method_ids: uuidList,
});

export type CouponInput = z.infer<typeof couponInputSchema>;
export type CouponFormInput = z.input<typeof couponInputSchema>;

export const bulkCouponIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const giftCardInputSchema = z.object({
  code: z.string().trim().min(4).max(50).optional(),
  name: optionalText,
  amount: z.number().positive("Amount must be positive."),
  customer_id: z.string().uuid().nullable().optional(),
  issued_to_email: optionalText,
  expires_at: z.string().nullable().optional(),
  notes: optionalText,
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
