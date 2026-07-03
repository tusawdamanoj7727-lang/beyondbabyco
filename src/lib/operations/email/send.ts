import "server-only";

import type { EmailPayload } from "@/lib/communications/types";
import { logger } from "@/lib/observability/logger";

import { getEmailProviderConfig } from "./config";
import { sendWithProvider } from "./providers";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Send email with retry handling and graceful failure logging. */
export async function sendEmail(payload: EmailPayload): Promise<{ id: string; ok: boolean; error?: string; attempts: number }> {
  const config = getEmailProviderConfig();
  const maxAttempts = Math.max(1, config.maxRetries);
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await sendWithProvider(payload);
      if (result.ok) {
        logger.info("email.send.success", { id: result.id, attempt, provider: config.provider });
        return { ...result, attempts: attempt };
      }
      lastError = result.error;
      logger.warn("email.send.failed", { attempt, error: result.error, provider: config.provider });
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown send error";
      logger.error("email.send.exception", { attempt, error: lastError, provider: config.provider });
    }

    if (attempt < maxAttempts) {
      await sleep(config.retryDelayMs * attempt);
    }
  }

  return { id: "send-failed", ok: false, error: lastError ?? "Email send failed after retries", attempts: maxAttempts };
}
