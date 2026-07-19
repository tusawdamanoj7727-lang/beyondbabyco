/** @deprecated Prefer HELP_FAQ_ITEMS from `@/lib/content/help` — kept for existing imports. */
export { STOREFRONT_FAQ_ITEMS, HELP_FAQ_ITEMS, type HelpFaqItem } from "@/lib/content/help";

export type FaqItem = {
  question: string;
  answer: string;
};
