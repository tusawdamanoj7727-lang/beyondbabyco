import "server-only";

import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/observability/logger";
import { NOTIFY_ME_MESSAGES } from "@/lib/notify-me/messages";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NotifyMeSubscribeCode = "invalid" | "duplicate" | "error";

export type NotifyMeSubscribeResponse = {
  success: boolean;
  message: string;
  code?: NotifyMeSubscribeCode;
};

const emailSchema = z.string().trim().email();

export async function subscribeToNotifyMe(input: {
  email: string;
  productCategory: string;
  productId?: string;
  mode?: "launch" | "restock";
  productName?: string;
}): Promise<NotifyMeSubscribeResponse> {
  const parsedEmail = emailSchema.safeParse(input.email);
  const category = input.productCategory.trim();

  if (!parsedEmail.success || category.length === 0) {
    return {
      success: false,
      code: "invalid",
      message: NOTIFY_ME_MESSAGES.invalid,
    };
  }

  const email = parsedEmail.data.toLowerCase();
  const isRestock = input.mode === "restock";

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: isRestock
        ? NOTIFY_ME_MESSAGES.restockSuccess(input.productName ?? category)
        : NOTIFY_ME_MESSAGES.success(category),
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error: waitlistError } = await supabase.from("waitlist").insert({
    email,
    product_category: category,
    product_id: input.productId ?? null,
    source: "website",
  });

  if (waitlistError && waitlistError.code !== "23505") {
    logger.error("notify-me.waitlist.failed", {
      email,
      category,
      error: waitlistError.message,
      code: waitlistError.code,
    });
    return {
      success: false,
      code: "error",
      message: NOTIFY_ME_MESSAGES.error,
    };
  }

  if (waitlistError?.code === "23505") {
    return {
      success: true,
      message: NOTIFY_ME_MESSAGES.duplicate(category),
      code: "duplicate",
    };
  }

  if (input.productId) {
    const { error: productError } = await supabase.from("waitlist_emails").insert({
      email,
      product_id: input.productId,
    });

    if (productError && productError.code !== "23505") {
      logger.warn("notify-me.product_waitlist.failed", {
        email,
        productId: input.productId,
        error: productError.message,
      });
    }
  }

  logger.info("notify-me.subscribe.success", { email, category, productId: input.productId });

  return {
    success: true,
    message:
      input.productId && !isRestock
        ? NOTIFY_ME_MESSAGES.availableSuccess
        : isRestock
          ? NOTIFY_ME_MESSAGES.restockSuccess(input.productName ?? category)
          : NOTIFY_ME_MESSAGES.success(category),
  };
}
