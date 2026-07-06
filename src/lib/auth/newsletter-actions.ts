"use server";

import {
  subscribeToNewsletter,
} from "@/lib/newsletter/subscribe";

export interface NewsletterSubscribeState {
  error: string | null;
  success: string | null;
}

export async function newsletterSubscribeAction(
  _prev: NewsletterSubscribeState,
  formData: FormData,
): Promise<NewsletterSubscribeState> {
  const result = await subscribeToNewsletter(
    String(formData.get("email") ?? ""),
    "homepage-newsletter",
  );

  if (result.success) {
    return { error: null, success: result.message };
  }

  return { error: result.message, success: null };
}

export async function earlyAccessSubscribeAction(
  _prev: NewsletterSubscribeState,
  formData: FormData,
): Promise<NewsletterSubscribeState> {
  const result = await subscribeToNewsletter(
    String(formData.get("email") ?? ""),
    "homepage-early-access",
  );

  if (result.success) {
    return {
      error: null,
      success: "You're on the early access list! Watch for your 20% off code at launch.",
    };
  }

  if (result.code === "duplicate") {
    return {
      error: null,
      success: "You're already on the early access list — we'll email your launch offer soon.",
    };
  }

  return { error: result.message, success: null };
}
