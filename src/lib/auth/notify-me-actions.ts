"use server";

import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface NotifyMeState {
  error: string | null;
  success: string | null;
}

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  product: z.string().trim().min(1, "Product is required"),
  interest: z.string().trim().optional(),
});

export async function notifyMeAction(
  _prev: NotifyMeState,
  formData: FormData,
): Promise<NotifyMeState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    product: formData.get("product"),
    interest: formData.get("interest") ?? undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      success: null,
    };
  }

  const { email, product, interest } = parsed.data;
  const source = interest ? `notify:${product}:${interest}` : `notify:${product}`;

  if (!isSupabaseConfigured()) {
    return {
      error: null,
      success: "You're on the list! We'll email you when this product launches.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({
    email,
    source,
    is_active: true,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error: null,
        success: "You're already on the list — we'll notify you at launch.",
      };
    }
    return { error: "Something went wrong. Please try again.", success: null };
  }

  return {
    error: null,
    success: "You're on the list! We'll email you when this product launches.",
  };
}
