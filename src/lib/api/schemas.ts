import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address.")
  .max(254)
  .transform((v) => v.toLowerCase());

export const uuidSchema = z.string().uuid();

export function shortString(max = 64) {
  return z.string().trim().max(max);
}

export function mediumString(max = 256) {
  return z.string().trim().max(max);
}

export function longString(max = 2000) {
  return z.string().trim().max(max);
}

export const notifyMeBodySchema = z
  .object({
    email: emailSchema,
    productCategory: shortString(64).optional(),
    productId: uuidSchema.optional(),
    productName: mediumString(256).optional(),
    mode: z.enum(["launch", "restock"]).optional(),
    source: shortString(64).optional(),
  })
  .refine((data) => Boolean(data.productCategory) || Boolean(data.productId), {
    message: "Product category or product ID is required.",
  });

export const newsletterSubscribeBodySchema = z.object({
  email: emailSchema,
  name: shortString(120).optional(),
  source: shortString(64).optional(),
});

export const newsletterBodySchema = z.object({
  email: emailSchema,
  source: shortString(64).optional(),
});

export const couponApplyBodySchema = z.object({
  code: shortString(64).min(1),
  cartTotal: z.number().nonnegative().finite(),
});

export const verifyPaymentBodySchema = z.object({
  orderId: uuidSchema,
  razorpay_order_id: mediumString(128).min(1),
  razorpay_payment_id: mediumString(128).min(1),
  razorpay_signature: mediumString(256).min(1),
});

export const tickerUpdateBodySchema = z.object({
  items: z.array(mediumString(256)).max(20),
});

export function parsePagination(
  searchParams: URLSearchParams,
  options: { maxPerPage?: number; defaultPerPage?: number } = {},
) {
  const maxPerPage = options.maxPerPage ?? 100;
  const defaultPerPage = options.defaultPerPage ?? 50;

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Math.min(
    maxPerPage,
    Math.max(1, Number(searchParams.get("perPage")) || defaultPerPage),
  );

  return { page, perPage };
}

export function parseLimit(
  searchParams: URLSearchParams,
  options: { max?: number; default?: number; param?: string } = {},
) {
  const max = options.max ?? 100;
  const defaultLimit = options.default ?? 50;
  const param = options.param ?? "limit";

  return Math.min(max, Math.max(1, Number(searchParams.get(param)) || defaultLimit));
}
