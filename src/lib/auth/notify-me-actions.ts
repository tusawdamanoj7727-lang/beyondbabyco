"use server";

import { z } from "zod";

import { subscribeToNotifyMe } from "@/lib/notify-me/subscribe";

export interface NotifyMeState {
  error: string | null;
  success: string | null;
}

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  product: z.string().trim().min(1, "Product is required"),
  productId: z.string().uuid().optional(),
  interest: z.string().trim().optional(),
});

/** Legacy server action — storefront uses POST /api/notify-me */
export async function notifyMeAction(
  _prev: NotifyMeState,
  formData: FormData,
): Promise<NotifyMeState> {
  const productIdRaw = formData.get("productId");
  const parsed = schema.safeParse({
    email: formData.get("email"),
    product: formData.get("product"),
    productId: typeof productIdRaw === "string" && productIdRaw.length > 0 ? productIdRaw : undefined,
    interest: formData.get("interest") ?? undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: null,
    };
  }

  const { email, product, productId, interest } = parsed.data;
  const productCategory = interest ?? product;

  const result = await subscribeToNotifyMe({
    email,
    productCategory,
    productId,
    productName: product,
    mode: productId ? "restock" : "launch",
  });

  if (!result.success) {
    return { error: result.message, success: null };
  }

  return { error: null, success: result.message };
}
