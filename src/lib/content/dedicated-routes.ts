/** Content slugs with dedicated `src/app/(storefront)/<slug>/page.tsx` routes. */
export const DEDICATED_CONTENT_SLUGS = new Set([
  "privacy-policy",
  "terms-of-service",
  "shipping-policy",
  "refund-policy",
  "about",
  "research",
  "contact",
  "faq",
]);

/**
 * Registry slugs that only redirect (next.config) — never list in sitemap
 * or generateStaticParams as primary destinations.
 */
export const REDIRECT_ONLY_CONTENT_SLUGS = new Set([
  "return-policy",
  "cookies",
  "terms",
  "blog",
]);
