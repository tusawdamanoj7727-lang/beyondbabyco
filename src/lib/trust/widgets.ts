export type TrustWidget = {
  id: string;
  label: string;
  description: string;
  icon: string;
  href?: string;
};

export const TRUST_WIDGETS: TrustWidget[] = [
  {
    id: "genuine",
    label: "100% Genuine",
    description: "Authentic products direct from BeyondBabyCo",
    icon: "badge-check",
    href: "/trust-center",
  },
  {
    id: "shipping",
    label: "Fast Shipping",
    description: "Pan-India delivery with tracking",
    icon: "truck",
    href: "/shipping-policy",
  },
  {
    id: "payments",
    label: "Secure Payments",
    description: "Encrypted checkout via trusted gateways",
    icon: "lock",
    href: "/terms-of-service",
  },
  {
    id: "returns",
    label: "Easy Returns",
    description: "7-day return window on eligible items",
    icon: "rotate-ccw",
    href: "/refund-policy",
  },
  {
    id: "quality",
    label: "Premium Quality",
    description: "GMP manufacturing and ISO standards",
    icon: "award",
    href: "/certifications",
  },
  {
    id: "support",
    label: "Customer Support",
    description: "Mon–Sat, 10 AM – 6 PM IST",
    icon: "headphones",
    href: "/contact",
  },
  {
    id: "research",
    label: "Research Driven",
    description: "Five years of formulation science",
    icon: "beaker",
    href: "/research",
  },
  {
    id: "ingredients",
    label: "Safe Ingredients",
    description: "Paraben free, cruelty free, transparent",
    icon: "leaf",
    href: "/ingredients",
  },
];
