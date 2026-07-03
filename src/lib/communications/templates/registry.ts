import { ACCOUNT_EMAIL_TEMPLATES } from "./account";
import { DELIVERY_EMAIL_TEMPLATES } from "./delivery";
import { MARKETING_EMAIL_TEMPLATES } from "./marketing";
import { ORDER_EMAIL_TEMPLATES } from "./orders";
import type { EmailTemplate, EmailTemplateCategory } from "../types";

export const ALL_EMAIL_TEMPLATES: EmailTemplate[] = [
  ...ACCOUNT_EMAIL_TEMPLATES,
  ...ORDER_EMAIL_TEMPLATES,
  ...DELIVERY_EMAIL_TEMPLATES,
  ...MARKETING_EMAIL_TEMPLATES,
];

const TEMPLATE_MAP = new Map(ALL_EMAIL_TEMPLATES.map((t) => [t.id, t]));

export function getEmailTemplate(id: string): EmailTemplate | undefined {
  return TEMPLATE_MAP.get(id);
}

export function getEmailTemplatesByCategory(category: EmailTemplateCategory): EmailTemplate[] {
  return ALL_EMAIL_TEMPLATES.filter((t) => t.category === category);
}

export const EMAIL_TEMPLATE_COUNTS = {
  account: ACCOUNT_EMAIL_TEMPLATES.length,
  order: ORDER_EMAIL_TEMPLATES.length,
  delivery: DELIVERY_EMAIL_TEMPLATES.length,
  marketing: MARKETING_EMAIL_TEMPLATES.length,
  total: ALL_EMAIL_TEMPLATES.length,
} as const;

export { ACCOUNT_EMAIL_TEMPLATES, ORDER_EMAIL_TEMPLATES, DELIVERY_EMAIL_TEMPLATES, MARKETING_EMAIL_TEMPLATES };
