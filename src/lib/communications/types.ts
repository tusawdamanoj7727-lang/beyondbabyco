export type EmailTemplateCategory = "account" | "order" | "delivery" | "marketing";

export type NotificationChannel = "email" | "push" | "sms" | "whatsapp" | "in_app";

export type NotificationCategory =
  | "orders"
  | "offers"
  | "account"
  | "payments"
  | "support"
  | "delivery"
  | "system";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type EmailTemplate = {
  id: string;
  name: string;
  category: EmailTemplateCategory;
  subject: string;
  preheader: string;
  heading: string;
  /** HTML body paragraphs — supports {{variable}} placeholders */
  bodyHtml: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  showTrustBadges?: boolean;
  sampleData: Record<string, string>;
};

export type MultiChannelNotification = {
  id: string;
  name: string;
  category: NotificationCategory;
  emailTemplateId?: string;
  channels: Partial<
    Record<
      NotificationChannel,
      {
        title: string;
        body: string;
        cta?: { label: string; href: string };
        icon?: string;
        deepLink?: string;
        priority: NotificationPriority;
      }
    >
  >;
  sampleData: Record<string, string>;
};

export type RenderedEmail = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

export type EmailRenderOptions = {
  darkMode?: boolean;
  preview?: boolean;
};

/** Provider adapter interfaces — prepared for future integrations (Part 11). */
export type EmailAttachment = {
  filename: string;
  content: Buffer | Uint8Array;
  contentType?: string;
};

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: string[];
  metadata?: Record<string, string>;
  attachments?: EmailAttachment[];
};

export type SmsPayload = {
  to: string;
  body: string;
  metadata?: Record<string, string>;
};

export type PushPayload = {
  token: string;
  title: string;
  body: string;
  deepLink?: string;
  icon?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, string>;
};

export type WhatsAppPayload = {
  to: string;
  templateName: string;
  body: string;
  cta?: { label: string; url: string };
  metadata?: Record<string, string>;
};

export interface EmailProviderAdapter {
  readonly name: string;
  send(payload: EmailPayload): Promise<{ id: string; ok: boolean; error?: string }>;
}

export interface SmsProviderAdapter {
  readonly name: string;
  send(payload: SmsPayload): Promise<{ id: string; ok: boolean; error?: string }>;
}

export interface PushProviderAdapter {
  readonly name: string;
  send(payload: PushPayload): Promise<{ id: string; ok: boolean; error?: string }>;
}

export interface WhatsAppProviderAdapter {
  readonly name: string;
  send(payload: WhatsAppPayload): Promise<{ id: string; ok: boolean; error?: string }>;
}
