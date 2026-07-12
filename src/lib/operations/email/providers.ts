import "server-only";

import type { EmailPayload } from "@/lib/communications/types";
import { sendEmail } from "@/lib/email/sendEmail";

export type EmailSendResult = { id: string; ok: boolean; error?: string };

/** @deprecated Use sendEmail from @/lib/email directly. */
export async function sendWithProvider(payload: EmailPayload): Promise<EmailSendResult> {
  const result = await sendEmail(payload);
  return { id: result.id, ok: result.ok, error: result.error };
}
