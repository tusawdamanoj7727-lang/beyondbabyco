export { EMAIL_BRAND } from "./brand";
export { interpolate, htmlToPlainText } from "./interpolate";
export { renderEmailLayout, renderEmailTemplate } from "./layout";
export { BASE_SAMPLE_DATA, mergeSampleData } from "./sample-data";
export type {
  EmailTemplate,
  EmailTemplateCategory,
  MultiChannelNotification,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  RenderedEmail,
  EmailRenderOptions,
  EmailPayload,
  SmsPayload,
  PushPayload,
  WhatsAppPayload,
  EmailProviderAdapter,
  SmsProviderAdapter,
  PushProviderAdapter,
  WhatsAppProviderAdapter,
} from "./types";
export {
  ALL_EMAIL_TEMPLATES,
  getEmailTemplate,
  getEmailTemplatesByCategory,
  EMAIL_TEMPLATE_COUNTS,
} from "./templates/registry";
export {
  NOTIFICATION_TEMPLATES,
  getNotificationTemplate,
  getNotificationsByCategory,
  renderNotificationChannel,
} from "./notifications/multi-channel";
