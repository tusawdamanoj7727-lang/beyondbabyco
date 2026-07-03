import type { ContentPage } from "@/lib/content/types";

import {
  aboutPage,
  careersPage,
  ourStoryPage,
  pressPage,
  whyBeyondBabyCoPage,
} from "./pages/company";
import {
  certificationsPage,
  ingredientsPage,
  manufacturingPage,
  researchPage,
  safetyStandardsPage,
} from "./pages/science";
import {
  cookiesPage,
  privacyPolicyPage,
  refundPolicyPage,
  returnPolicyPage,
  shippingPolicyPage,
  termsPage,
} from "./pages/legal";
import { contactPage, faqPage } from "./pages/support";

export const CONTENT_PAGES: ContentPage[] = [
  aboutPage,
  ourStoryPage,
  researchPage,
  ingredientsPage,
  whyBeyondBabyCoPage,
  manufacturingPage,
  certificationsPage,
  safetyStandardsPage,
  contactPage,
  privacyPolicyPage,
  termsPage,
  shippingPolicyPage,
  refundPolicyPage,
  returnPolicyPage,
  cookiesPage,
  faqPage,
  careersPage,
  pressPage,
];

const PAGE_MAP = new Map(CONTENT_PAGES.map((p) => [p.slug, p]));

export function getContentPage(slug: string): ContentPage | undefined {
  return PAGE_MAP.get(slug);
}

export function getAllContentSlugs(): string[] {
  return CONTENT_PAGES.map((p) => p.slug);
}

export function getAllFaqItems(page: ContentPage) {
  return page.sections
    .filter((s): s is Extract<typeof s, { type: "faq" }> => s.type === "faq")
    .flatMap((s) => s.items);
}
