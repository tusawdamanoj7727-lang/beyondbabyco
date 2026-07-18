import { z } from "zod";

import { GATEWAY_PROVIDERS } from "./payment-types";

const optionalText = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .nullable()
  .transform((v) => (v && v.length ? v : null));

export const gatewayInputSchema = z
  .object({
    display_name: z.string().trim().min(1).max(200),
    provider: z.enum(GATEWAY_PROVIDERS),
    sandbox: z.boolean().default(true),
    api_key: optionalText,
    api_secret: optionalText,
    webhook_secret: optionalText,
    webhook_url: optionalText,
    currency: z.string().trim().length(3).default("INR"),
    is_enabled: z.boolean().default(false),
    priority: z.number().int().default(0),
  })
  .superRefine((data, ctx) => {
    const secret = data.webhook_secret?.trim();
    if (!secret) return;
    if (/^https?:\/\//i.test(secret) || secret.includes("/api/webhooks/payments")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["webhook_secret"],
        message: "Webhook secret must be the Razorpay signing secret, not the webhook URL.",
      });
    }
  });

export const manualCaptureSchema = z.object({
  payment_id: z.string().uuid(),
});

export const manualRefundSchema = z.object({
  payment_id: z.string().uuid(),
  amount: z.number().positive(),
  reason: optionalText,
  full: z.boolean().default(false),
});

export const syncSettlementSchema = z.object({
  gateway_id: z.string().uuid(),
  settlement_date: z.string().min(1),
});

export const bulkGatewayIdsSchema = z.object({
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
