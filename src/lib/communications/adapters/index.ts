import type {
  EmailProviderAdapter,
  EmailPayload,
  PushProviderAdapter,
  PushPayload,
  SmsProviderAdapter,
  SmsPayload,
  WhatsAppProviderAdapter,
  WhatsAppPayload,
} from "../types";

async function dispatchEmail(payload: EmailPayload): Promise<{ id: string; ok: boolean; error?: string }> {
  const { sendEmail } = await import("@/lib/email/sendEmail");
  const result = await sendEmail(payload);
  return { id: result.id, ok: result.ok, error: result.error };
}

/** Hostinger SMTP email adapter. */
export class SmtpAdapter implements EmailProviderAdapter {
  readonly name = "smtp";

  async send(payload: EmailPayload): Promise<{ id: string; ok: boolean; error?: string }> {
    const { isSmtpConfigured } = await import("@/lib/email/config");
    if (!isSmtpConfigured()) {
      return { id: "smtp-not-configured", ok: false, error: "SMTP integration not configured" };
    }
    return dispatchEmail(payload);
  }
}

/** Prepared adapter — Twilio SMS (not implemented). */
export class TwilioAdapter implements SmsProviderAdapter {
  readonly name = "twilio";

  async send(_payload: SmsPayload): Promise<{ id: string; ok: boolean; error?: string }> {
    return { id: "twilio-not-configured", ok: false, error: "Twilio integration not configured" };
  }
}

/** Prepared adapter — WhatsApp Business (not implemented). */
export class WhatsAppBusinessAdapter implements WhatsAppProviderAdapter {
  readonly name = "whatsapp-business";

  async send(_payload: WhatsAppPayload): Promise<{ id: string; ok: boolean; error?: string }> {
    return { id: "whatsapp-not-configured", ok: false, error: "WhatsApp Business integration not configured" };
  }
}

/** Prepared adapter — Firebase Push (not implemented). */
export class FirebasePushAdapter implements PushProviderAdapter {
  readonly name = "firebase-push";

  async send(_payload: PushPayload): Promise<{ id: string; ok: boolean; error?: string }> {
    return { id: "firebase-not-configured", ok: false, error: "Firebase Push integration not configured" };
  }
}

export const PROVIDER_ADAPTERS = {
  email: {
    smtp: SmtpAdapter,
  },
  sms: { twilio: TwilioAdapter },
  whatsapp: { whatsappBusiness: WhatsAppBusinessAdapter },
  push: { firebase: FirebasePushAdapter },
} as const;

export async function getActiveEmailAdapter(): Promise<EmailProviderAdapter | null> {
  const { isSmtpConfigured } = await import("@/lib/email/config");
  if (!isSmtpConfigured()) return null;
  return new SmtpAdapter();
}
