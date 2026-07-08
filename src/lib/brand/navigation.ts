/** Canonical storefront paths — single source for header, footer, and emails. */
export const CANONICAL_PATHS = {
  home: "/",
  products: "/products",
  about: "/about",
  research: "/research",
  blog: "/blog",
  contact: "/contact",
  faq: "/faq",
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
  { label: "Research", href: CANONICAL_PATHS.research },
  { label: "Blog", href: CANONICAL_PATHS.blog },
  { label: "Contact", href: CANONICAL_PATHS.contact },
];

export type FooterNavItem = NavLink | { label: string; comingSoon: true };

export const FOOTER_QUICK_LINKS: readonly NavLink[] = [
  { label: "Home", href: CANONICAL_PATHS.home },
  { label: "Products", href: CANONICAL_PATHS.products },
  { label: "About", href: CANONICAL_PATHS.about },
  { label: "Contact", href: CANONICAL_PATHS.contact },
  { label: "FAQ", href: CANONICAL_PATHS.faq },
];

export const FOOTER_COMPANY_LINKS: readonly FooterNavItem[] = [
  { label: "About", href: CANONICAL_PATHS.about },
  { label: "Research", href: CANONICAL_PATHS.research },
  { label: "Blog", href: CANONICAL_PATHS.blog },
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
