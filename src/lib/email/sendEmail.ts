import "server-only";

import type { EmailPayload } from "@/lib/communications/types";
import { logger } from "@/lib/observability/logger";

import { getSmtpConfig } from "./config";
import { getTransporter } from "./transporter";

export interface EmailSendResult {
  id: string;
  ok: boolean;
  error?: string;
  attempts: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Send email via shared Hostinger SMTP transporter. Never throws. */
export async function sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
  const config = getSmtpConfig();
  if (!config) {
    return {
      id: "smtp-not-configured",
      ok: false,
      error: "SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM required)",
      attempts: 0,
    };
  }

  const maxAttempts = Math.max(1, config.maxRetries);
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const transport = getTransporter();
      const info = await transport.sendMail({
        from: payload.from ?? config.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        replyTo: payload.replyTo ?? config.replyTo ?? undefined,
        attachments: payload.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content),
          contentType: a.contentType ?? "application/octet-stream",
        })),
      });

      logger.info("email.send.success", { id: info.messageId, attempt, to: payload.to });
      return { id: info.messageId ?? `smtp-${Date.now()}`, ok: true, attempts: attempt };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown send error";
      logger.error("email.send.exception", { attempt, error: lastError, to: payload.to });
      if (attempt < maxAttempts) {
        await sleep(config.retryDelayMs * attempt);
      }
    }
  }

  return {
    id: "send-failed",
    ok: false,
    error: lastError ?? "Email send failed after retries",
    attempts: maxAttempts,
  };
}

/** Fire-and-forget email — must not block auth, checkout, or redirects. */
export function sendEmailAsync(payload: EmailPayload): void {
  void sendEmail(payload).catch((error) => {
    console.error("[email] send failed:", error);
  });
}
