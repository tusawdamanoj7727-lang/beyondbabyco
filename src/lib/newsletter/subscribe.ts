import "server-only";

import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/observability/logger";
import { NEWSLETTER_MESSAGES } from "@/lib/newsletter/messages";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export { NEWSLETTER_MESSAGES } from "@/lib/newsletter/messages";

export type NewsletterSubscribeCode = "invalid" | "duplicate" | "error";

export type NewsletterSubscribeResponse = {
  success: boolean;
  message: string;
  code?: NewsletterSubscribeCode;
};

const emailSchema = z.string().trim().email();

function mapSource(source: string): string {
  if (source === "homepage-newsletter" || source === "website_newsletter") {
    return "website_newsletter";
  }
  return source;
}

async function subscribeViaKlaviyo(
  email: string,
  source: string,
): Promise<{ ok: true } | { ok: false; duplicate?: boolean }> {
  const apiKey = process.env.KLAVIYO_API_KEY?.trim();
  if (!apiKey) return { ok: false };

  try {
    const response = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        revision: "2024-02-15",
      },
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: {
            email,
            properties: { source: mapSource(source) },
          },
        },
      }),
    });

    if (response.ok) return { ok: true };
    if (response.status === 409) return { ok: false, duplicate: true };

    const body = await response.text().catch(() => "");
    if (/duplicate|already exists/i.test(body)) {
      return { ok: false, duplicate: true };
    }

    logger.warn("newsletter.klaviyo.failed", {
      email,
      status: response.status,
      body: body.slice(0, 200),
    });
    return { ok: false };
  } catch (error) {
    logger.error("newsletter.klaviyo.error", {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false };
  }
}

async function subscribeViaSupabase(
  email: string,
  source: string,
  name?: string | null,
): Promise<{ ok: true } | { ok: false; duplicate?: boolean }> {
  if (!isSupabaseConfigured()) {
    return { ok: false };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({
    email,
    name: name ?? null,
    source,
    is_active: true,
    subscribed_at: new Date().toISOString(),
  });

  if (!error) return { ok: true };
  if (error.code === "23505") return { ok: false, duplicate: true };

  logger.error("newsletter.supabase.failed", {
    email,
    error: error.message,
    code: error.code,
  });
  return { ok: false };
}

/** Klaviyo when configured; otherwise Supabase `newsletter_subscribers`. */
export async function subscribeToNewsletter(
  email: string,
  source = "website_newsletter",
): Promise<NewsletterSubscribeResponse> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return {
      success: false,
      code: "invalid",
      message: NEWSLETTER_MESSAGES.invalid,
    };
  }

  const normalized = parsed.data.toLowerCase();
  const hasKlaviyo = Boolean(process.env.KLAVIYO_API_KEY?.trim());

  if (hasKlaviyo) {
    const klaviyo = await subscribeViaKlaviyo(normalized, source);
    if (klaviyo.ok) {
      void subscribeViaSupabase(normalized, source).catch(() => undefined);
      logger.info("newsletter.subscribe.success", { email: normalized, provider: "klaviyo", source });
      return { success: true, message: NEWSLETTER_MESSAGES.success };
    }
    if (klaviyo.duplicate) {
      return {
        success: false,
        code: "duplicate",
        message: NEWSLETTER_MESSAGES.duplicate,
      };
    }
  }

  const supabase = await subscribeViaSupabase(normalized, source);
  if (supabase.ok) {
    logger.info("newsletter.subscribe.success", {
      email: normalized,
      provider: hasKlaviyo ? "supabase_fallback" : "supabase",
      source,
    });
    return { success: true, message: NEWSLETTER_MESSAGES.success };
  }

  if (supabase.duplicate) {
    return {
      success: false,
      code: "duplicate",
      message: NEWSLETTER_MESSAGES.duplicate,
    };
  }

  return {
    success: false,
    code: "error",
    message: NEWSLETTER_MESSAGES.error,
  };
}
