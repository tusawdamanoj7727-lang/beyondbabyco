import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .nullable()
  .transform((v) => (v && v.length ? v : null));

export const customerInputSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email").optional().nullable().or(z.literal("")).transform((v) => (v ? v : null)),
  phone: optionalText,
  avatar_url: optionalText,
  status: z.enum(["active", "inactive"] as const).default("active"),
  is_vip: z.boolean().default(false),
  notes: optionalText,
  internal_notes: optionalText,
  tags: z.array(z.string().trim().min(1)).default([]),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;

export const customerAddressSchema = z.object({
  id: z.string().uuid().optional(),
  customer_id: z.string().uuid(),
  type: z.enum(["billing", "shipping"] as const),
  full_name: optionalText,
  phone: optionalText,
  line1: z.string().trim().min(1),
  line2: optionalText,
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  country: z.string().trim().default("India"),
  pincode: z.string().trim().min(1),
  is_default: z.boolean().default(false),
});

export type CustomerAddressInput = z.infer<typeof customerAddressSchema>;

export const mergeCustomersSchema = z.object({
  primary_id: z.string().uuid(),
  secondary_id: z.string().uuid(),
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
