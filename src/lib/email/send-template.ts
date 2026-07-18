import "server-only";

import type { EmailAttachment } from "@/lib/communications/types";
import { renderEmailTemplate } from "@/lib/communications/layout";
import { getEmailTemplate } from "@/lib/communications/templates/registry";

import { sendEmail, sendEmailAsync } from "./sendEmail";

export async function sendTemplateEmail(
  templateId: string,
  to: string,
  data?: Record<string, string>,
  options?: { attachments?: EmailAttachment[] },
): Promise<{ ok: boolean; error?: string }> {
  const template = getEmailTemplate(templateId);
  if (!template) {
    return { ok: false, error: `Email template not found: ${templateId}` };
  }

  const rendered = renderEmailTemplate(template, { ...template.sampleData, ...data });
  const result = await sendEmail({
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    tags: [templateId],
    metadata: { templateId },
    attachments: options?.attachments,
  });

  return { ok: result.ok, error: result.error };
}

/** Non-blocking template send for order/auth/checkout flows. */
export function sendTemplateEmailAsync(
  templateId: string,
  to: string,
  data?: Record<string, string>,
): void {
  void sendTemplateEmail(templateId, to, data).catch((error) => {
    console.error(`[email] template ${templateId} failed:`, error);
  });
}
