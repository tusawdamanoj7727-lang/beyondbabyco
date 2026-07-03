import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "dashboard"
  | "products"
  | "categories"
  | "brands"
  | "inventory"
  | "media"
  | "orders"
  | "customers"
  | "reviews"
  | "coupons"
  | "giftcards"
  | "homepage"
  | "banners"
  | "blog"
  | "newsletter"
  | "testimonials"
  | "payments"
  | "expenses"
  | "gst"
  | "reports"
  | "accounting"
  | "staff"
  | "roles"
  | "audit"
  | "settings"
  | "search"
  | "bell"
  | "menu"
  | "close"
  | "chevronLeft"
  | "chevronRight"
  | "chevronDown"
  | "logout"
  | "user"
  | "plus"
  | "sparkles"
  | "activity"
  | "revenue"
  | "external"
  | "panelLeft";

const paths: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  products: (
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5Z" />
      <path d="m3 8 9 5 9-5" />
      <path d="M12 13v8" />
    </>
  ),
  categories: (
    <>
      <path d="M20.6 13.3 13.3 20.6a1.6 1.6 0 0 1-2.3 0l-7.6-7.6V3h10l7.2 7.2a1.6 1.6 0 0 1 0 3.1Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </>
  ),
  brands: (
    <>
      <path d="m12 3 2.5 5.3 5.8.8-4.2 4 1 5.7L12 16.9 6.9 18.8l1-5.7-4.2-4 5.8-.8Z" />
    </>
  ),
  inventory: (
    <>
      <path d="M3 7h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <path d="M3 7 5 3h14l2 4" />
      <path d="M9 12h6" />
    </>
  ),
  media: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m21 16-5-5L5 21" />
    </>
  ),
  orders: (
    <>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.4 12.1a1 1 0 0 0 1 .9H18a1 1 0 0 0 1-.8L21 7H6" />
    </>
  ),
  customers: (
    <>
      <path d="M16 19a4 4 0 0 0-8 0" />
      <circle cx="12" cy="8" r="3.2" />
      <path d="M20 19a4 4 0 0 0-3-3.8" />
      <path d="M4 19a4 4 0 0 1 3-3.8" />
    </>
  ),
  reviews: (
    <>
      <path d="m12 4 2.2 4.6 5 .5-3.7 3.4 1 5-4.5-2.5L7.5 17l1-5L4.8 8.6l5-.5Z" />
    </>
  ),
  coupons: (
    <>
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />
      <path d="M9 7v10" />
    </>
  ),
  giftcards: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M3 12h18" />
      <path d="M12 8V5" />
      <path d="M12 5a2 2 0 1 0-2-2c0 1.2.9 2 2 2Z" />
      <path d="M12 5a2 2 0 1 1 2-2c0 1.2-.9 2-2 2Z" />
    </>
  ),
  homepage: (
    <>
      <path d="m3 11 9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  banners: (
    <>
      <path d="M4 4v16l4-3 4 3 4-3 4 3V4Z" />
      <path d="M8 9h8" />
    </>
  ),
  blog: (
    <>
      <path d="M4 4h11l5 5v11a0 0 0 0 1 0 0H4Z" />
      <path d="M14 4v5h5" />
      <path d="M8 13h7M8 17h5" />
    </>
  ),
  newsletter: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  testimonials: (
    <>
      <path d="M8 11c0-2 1-3 3-3" />
      <path d="M5 7h6v6H7l-2 3Z" />
      <path d="M14 7h5v6h-3l-2 3Z" />
    </>
  ),
  payments: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </>
  ),
  expenses: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.2A2.5 2.5 0 0 1 12 8c2 0 2.5 1.2 2.5 2 0 2-5 1.4-5 3.5 0 1 .8 2 2.5 2a2.6 2.6 0 0 0 2.4-1.3" />
    </>
  ),
  gst: (
    <>
      <path d="M19 5 5 19" />
      <circle cx="7.5" cy="7.5" r="2" />
      <circle cx="16.5" cy="16.5" r="2" />
    </>
  ),
  reports: (
    <>
      <path d="M3 3v18h18" />
      <path d="m7 14 3-3 3 3 4-5" />
    </>
  ),
  accounting: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </>
  ),
  staff: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <circle cx="18" cy="9" r="2" />
      <path d="M16 20a4 4 0 0 1 6-3" />
    </>
  ),
  roles: (
    <>
      <path d="M12 3 5 6v5c0 4 3 7 7 8 4-1 7-4 7-8V6Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  audit: (
    <>
      <path d="M5 4h14v16H5Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M5 5l2 2M17 17l2 2M2 12h3M19 12h3M5 19l2-2M17 7l2-2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  sparkles: (
    <>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" />
      <path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8Z" />
    </>
  ),
  activity: <path d="M3 12h4l3 8 4-16 3 8h4" />,
  revenue: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l3-4 3 2 4-6" />
      <path d="M17 7h-3M17 7v3" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" />
    </>
  ),
  panelLeft: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export default function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
