"use server";

import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/observability/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface NewsletterSubscribeState {
  error: string | null;
  success: string | null;
}

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export async function newsletterSubscribeAction(
  _prev: NewsletterSubscribeState,
  formData: FormData,
): Promise<NewsletterSubscribeState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid email",
      success: null,
    };
  }

  const { email } = parsed.data;

  if (!isSupabaseConfigured()) {
    logger.warn("newsletter.subscribe.skipped", { reason: "supabase_not_configured", email });
    return {
      error: "Newsletter signup is temporarily unavailable. Please try again later.",
      success: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({
    email,
    source: "homepage-newsletter",
    is_active: true,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error: null,
        success: "You're already on the list — thank you for being part of our community.",
      };
    }
    logger.error("newsletter.subscribe.failed", { email, error: error.message, code: error.code });
    return { error: "Something went wrong. Please try again.", success: null };
  }

  logger.info("newsletter.subscribe.success", { email, source: "homepage-newsletter" });
  return {
    error: null,
    success: "You're on the list. We'll write when there is something worth sharing.",
  };
}
