import { z } from "zod";

import { REVIEW_STATUSES } from "./review-types";

const optionalText = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .nullable()
  .transform((v) => (v && v.length ? v : null));

export const moderationDecisionSchema = z.object({
  review_id: z.string().uuid(),
  reason: optionalText,
  notes: optionalText,
});

export const bulkReviewIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  reason: optionalText,
});

export const featureReviewSchema = z.object({
  review_id: z.string().uuid(),
  featured: z.boolean(),
});

export const reviewStatusSchema = z.enum(REVIEW_STATUSES);

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
