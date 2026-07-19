/** Canonical storefront paths — single source for header, footer, and emails. */
export const CANONICAL_PATHS = {
  home: "/",
  products: "/products",
  about: "/about",
  research: "/research",
  learn: "/learn",
  help: "/help",
  blog: "/blog",
  contact: "/contact",
  faq: "/faq",
  ingredients: "/ingredients",
  trustCenter: "/trust-center",
  trackOrder: "/track-order",
  account: "/account",
  login: "/login",
  cart: "/cart",
  wishlist: "/wishlist",
  community: "/community",
  privacyPolicy: "/privacy-policy",
  termsOfService: "/terms-of-service",
  shippingPolicy: "/shipping-policy",
  refundPolicy: "/refund-policy",
} as const;

export type NavLink = { label: string; href: string };

/** Primary header + mobile drawer links. */
export const PRIMARY_NAV_LINKS: readonly NavLink[] = [
  { label: "Products", href: CANONICAL_PATHS.products },
  { label: "About", href: CANONICAL_PATHS.about },
  { label: "Learn", href: CANONICAL_PATHS.learn },
  { label: "Research", href: CANONICAL_PATHS.research },
  { label: "Contact", href: CANONICAL_PATHS.contact },
];

export type FooterNavItem = NavLink | { label: string; comingSoon: true };

export const FOOTER_QUICK_LINKS: readonly NavLink[] = [
  { label: "Home", href: CANONICAL_PATHS.home },
  { label: "Products", href: CANONICAL_PATHS.products },
  { label: "About", href: CANONICAL_PATHS.about },
  { label: "Learn", href: CANONICAL_PATHS.learn },
  { label: "Help", href: CANONICAL_PATHS.help },
  { label: "Contact", href: CANONICAL_PATHS.contact },
  { label: "Track Order", href: CANONICAL_PATHS.trackOrder },
  { label: "FAQ", href: CANONICAL_PATHS.faq },
];

export const FOOTER_COMPANY_LINKS: readonly FooterNavItem[] = [
  { label: "About", href: CANONICAL_PATHS.about },
  { label: "Our Story", href: "/our-story" },
  { label: "Research", href: CANONICAL_PATHS.research },
  { label: "Trust Center", href: CANONICAL_PATHS.trustCenter },
  { label: "Ingredients", href: CANONICAL_PATHS.ingredients },
  { label: "Help Center", href: CANONICAL_PATHS.help },
  { label: "Careers", comingSoon: true },
  { label: "Press", comingSoon: true },
];

/** Refund & Return Policy is one page at /refund-policy (/return-policy redirects). */
export const FOOTER_LEGAL_LINKS: readonly NavLink[] = [
  { label: "Privacy Policy", href: CANONICAL_PATHS.privacyPolicy },
  { label: "Terms of Service", href: CANONICAL_PATHS.termsOfService },
  { label: "Shipping Policy", href: CANONICAL_PATHS.shippingPolicy },
  { label: "Refund Policy", href: CANONICAL_PATHS.refundPolicy },
];

/** Header account icon — /account redirects unauthenticated users to /login. */
export const HEADER_ACCOUNT_HREF = CANONICAL_PATHS.account;
