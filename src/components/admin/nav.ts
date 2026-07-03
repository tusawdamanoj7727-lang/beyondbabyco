import type { IconName } from "./Icon";
import { PERMISSIONS, type Permission } from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/roles";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  /** Permission required to see this item. Admin always passes. */
  permission?: Permission;
  /** Restrict to specific roles (in addition to admin). */
  roles?: Role[];
  /** Visible only to the admin role. */
  adminOnly?: boolean;
  /** Marks routes that have no page yet (rendered, but flagged "soon"). */
  soon?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/admin", icon: "dashboard" }],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: "products", permission: PERMISSIONS.CATALOG_MANAGE },
      { label: "Categories", href: "/admin/categories", icon: "categories", permission: PERMISSIONS.CATALOG_MANAGE },
      { label: "Brands", href: "/admin/brands", icon: "brands", permission: PERMISSIONS.CATALOG_MANAGE },
      { label: "Inventory", href: "/admin/inventory", icon: "inventory", permission: PERMISSIONS.INVENTORY_MANAGE },
      { label: "Warehouses", href: "/admin/warehouses", icon: "inventory", permission: PERMISSIONS.INVENTORY_MANAGE },
      { label: "Suppliers", href: "/admin/suppliers", icon: "brands", permission: PERMISSIONS.INVENTORY_MANAGE },
      { label: "Media Library", href: "/admin/media", icon: "media", permission: PERMISSIONS.MEDIA_MANAGE },
      { label: "AI Assets", href: "/admin/ai-assets", icon: "media", permission: PERMISSIONS.MEDIA_MANAGE },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: "orders", permission: PERMISSIONS.ORDERS_MANAGE },
      { label: "Shipments", href: "/admin/shipments", icon: "activity", permission: PERMISSIONS.SHIPPING_MANAGE },
      { label: "Customers", href: "/admin/customers", icon: "customers", permission: PERMISSIONS.CUSTOMERS_MANAGE },
      { label: "Reviews", href: "/admin/reviews", icon: "reviews", permission: PERMISSIONS.REVIEWS_MANAGE },
      { label: "Returns", href: "/admin/returns", icon: "activity", permission: PERMISSIONS.RETURNS_MANAGE },
      { label: "Shipping", href: "/admin/shipping", icon: "orders", permission: PERMISSIONS.SHIPPING_MANAGE },
      { label: "Coupons", href: "/admin/coupons", icon: "coupons", permission: PERMISSIONS.MARKETING_MANAGE },
      { label: "Gift Cards", href: "/admin/gift-cards", icon: "giftcards", permission: PERMISSIONS.MARKETING_MANAGE, soon: true },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Marketing", href: "/admin/marketing", icon: "coupons", permission: PERMISSIONS.MARKETING_VIEW },
      { label: "Communications", href: "/admin/communications", icon: "newsletter", permission: PERMISSIONS.MARKETING_VIEW },
      { label: "Homepage CMS", href: "/admin/homepage", icon: "homepage", permission: PERMISSIONS.CMS_MANAGE },
      { label: "Banners", href: "/admin/banners", icon: "banners", permission: PERMISSIONS.CONTENT_MANAGE, soon: true },
      { label: "Blog", href: "/admin/blog", icon: "blog", permission: PERMISSIONS.CONTENT_MANAGE, soon: true },
      { label: "Newsletter", href: "/admin/newsletter", icon: "newsletter", permission: PERMISSIONS.CONTENT_MANAGE, soon: true },
      { label: "Testimonials", href: "/admin/testimonials", icon: "testimonials", permission: PERMISSIONS.CONTENT_MANAGE, soon: true },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: "reports", permission: PERMISSIONS.REPORTS_VIEW },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Payments", href: "/admin/payments", icon: "payments", permission: PERMISSIONS.PAYMENTS_MANAGE },
      { label: "Payment Gateways", href: "/admin/payment-gateways", icon: "accounting", permission: PERMISSIONS.PAYMENTS_MANAGE },
      { label: "Finance", href: "/admin/finance", icon: "accounting", permission: PERMISSIONS.FINANCE_VIEW },
      { label: "Legacy Reports", href: "/admin/reports", icon: "reports", permission: PERMISSIONS.REPORTS_VIEW },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Staff", href: "/admin/staff", icon: "staff", adminOnly: true, soon: true },
      { label: "Roles", href: "/admin/roles", icon: "roles", adminOnly: true, soon: true },
      { label: "Operations", href: "/admin/operations", icon: "settings", permission: PERMISSIONS.SETTINGS_MANAGE },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: "audit", permission: PERMISSIONS.SETTINGS_MANAGE, soon: true },
      { label: "Settings", href: "/admin/settings", icon: "settings", permission: PERMISSIONS.SETTINGS_MANAGE, soon: true },
    ],
  },
];

/** Flat list of every nav item — handy for breadcrumb/label lookups. */
export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/**
 * Decides whether a nav item is visible given the user's role + permissions.
 * Admin sees everything.
 */
export function canSeeNavItem(
  item: NavItem,
  role: Role | null,
  hasPermission: (p: Permission) => boolean,
): boolean {
  if (role === "admin") return true;
  if (item.adminOnly) return false;
  if (item.roles && (!role || !item.roles.includes(role))) return false;
  if (item.permission) return hasPermission(item.permission);
  return true;
}
