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
  const { sendEmail } = await import("@/lib/operations/email/send");
  const result = await sendEmail(payload);
  return { id: result.id, ok: result.ok, error: result.error };
}

async function activeProvider(): Promise<string | null> {
  const { getEmailProviderId } = await import("@/lib/operations/email/config");
  return getEmailProviderId();
}

/** Resend email adapter — delegates to operations email layer. */
export class ResendAdapter implements EmailProviderAdapter {
  readonly name = "resend";

  async send(payload: EmailPayload): Promise<{ id: string; ok: boolean; error?: string }> {
    const active = await activeProvider();
    if (!active) {
      return { id: "resend-not-configured", ok: false, error: "Resend integration not configured" };
    }
    if (active !== "resend") {
      return { id: "resend-not-active", ok: false, error: "EMAIL_PROVIDER is not resend" };
    }
    return dispatchEmail(payload);
  }
}

/** SendGrid email adapter. */
export class SendGridAdapter implements EmailProviderAdapter {
  readonly name = "sendgrid";

  async send(payload: EmailPayload): Promise<{ id: string; ok: boolean; error?: string }> {
    const active = await activeProvider();
    if (!active) {
      return { id: "sendgrid-not-configured", ok: false, error: "SendGrid integration not configured" };
    }
    if (active !== "sendgrid") {
      return { id: "sendgrid-not-active", ok: false, error: "EMAIL_PROVIDER is not sendgrid" };
    }
    return dispatchEmail(payload);
  }
}

/** AWS SES email adapter. */
export class SesAdapter implements EmailProviderAdapter {
  readonly name = "aws-ses";

  async send(payload: EmailPayload): Promise<{ id: string; ok: boolean; error?: string }> {
    const active = await activeProvider();
    if (!active) {
      return { id: "ses-not-configured", ok: false, error: "AWS SES integration not configured" };
    }
    if (active !== "ses") {
      return { id: "ses-not-active", ok: false, error: "EMAIL_PROVIDER is not ses" };
    }
    return dispatchEmail(payload);
  }
}

/** SMTP email adapter. */
export class SmtpAdapter implements EmailProviderAdapter {
  readonly name = "smtp";

  async send(payload: EmailPayload): Promise<{ id: string; ok: boolean; error?: string }> {
    const active = await activeProvider();
    if (!active) {
      return { id: "smtp-not-configured", ok: false, error: "SMTP integration not configured" };
    }
    if (active !== "smtp") {
      return { id: "smtp-not-active", ok: false, error: "EMAIL_PROVIDER is not smtp" };
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
    resend: ResendAdapter,
    sendgrid: SendGridAdapter,
    ses: SesAdapter,
    smtp: SmtpAdapter,
  },
  sms: { twilio: TwilioAdapter },
  whatsapp: { whatsappBusiness: WhatsAppBusinessAdapter },
  push: { firebase: FirebasePushAdapter },
} as const;

/** Resolve the active email adapter from EMAIL_PROVIDER env (server-side). */
export async function getActiveEmailAdapter(): Promise<EmailProviderAdapter | null> {
  const { getEmailProviderId } = await import("@/lib/operations/email/config");
  const id = getEmailProviderId();
  if (!id) return null;
  const Adapter = PROVIDER_ADAPTERS.email[id];
  return Adapter ? new Adapter() : null;
}
