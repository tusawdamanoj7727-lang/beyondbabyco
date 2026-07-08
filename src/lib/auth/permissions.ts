import { ROLES, type Role } from "./roles";

/**
 * Permission codes — mirrors the `permissions` table seeded in
 * `supabase/database/005_seed.sql`. The database is the source of truth at
 * runtime; this map provides typing and a static fallback.
 */
export const PERMISSIONS = {
  CATALOG_MANAGE: "catalog.manage",
  INVENTORY_MANAGE: "inventory.manage",
  ORDERS_MANAGE: "orders.manage",
  ORDERS_VIEW: "orders.view",
  CUSTOMERS_MANAGE: "customers.manage",
  CUSTOMERS_VIEW: "customers.view",
  CONTENT_MANAGE: "content.manage",
  REVIEWS_MANAGE: "reviews.manage",
  RETURNS_MANAGE: "returns.manage",
  MEDIA_MANAGE: "media.manage",
  CMS_MANAGE: "cms.manage",
  SUPPORT_MANAGE: "support.manage",
  MARKETING_MANAGE: "marketing.manage",
  MARKETING_VIEW: "marketing.view",
  MARKETING_SEND: "marketing.send",
  SHIPPING_MANAGE: "shipping.manage",
  PAYMENTS_MANAGE: "payments.manage",
  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",
  ANALYTICS_MANAGE: "analytics.manage",
  FINANCE_VIEW: "finance.view",
  FINANCE_MANAGE: "finance.manage",
  FINANCE_EXPORT: "finance.export",
  ACCOUNTING_MANAGE: "accounting.manage",
  SETTINGS_MANAGE: "settings.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: readonly Permission[] = Object.values(PERMISSIONS);

/**
 * Default role → permission mapping (mirrors the seeded role_permissions).
 * `admin` implicitly has every permission.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [ROLES.ADMIN]: ALL_PERMISSIONS,
  [ROLES.MANAGER]: [
    PERMISSIONS.CATALOG_MANAGE,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CONTENT_MANAGE,
    PERMISSIONS.REVIEWS_MANAGE,
    PERMISSIONS.RETURNS_MANAGE,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.CMS_MANAGE,
    PERMISSIONS.MARKETING_MANAGE,
    PERMISSIONS.MARKETING_VIEW,
    PERMISSIONS.MARKETING_SEND,
    PERMISSIONS.SHIPPING_MANAGE,
    PERMISSIONS.PAYMENTS_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_MANAGE,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_MANAGE,
    PERMISSIONS.FINANCE_EXPORT,
    PERMISSIONS.ACCOUNTING_MANAGE,
    PERMISSIONS.SETTINGS_MANAGE,
  ],
  [ROLES.SUPPORT]: [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.RETURNS_MANAGE,
    PERMISSIONS.SUPPORT_MANAGE,
  ],
  [ROLES.CUSTOMER]: [],
};

/** Static check using the default mapping (admin always passes). */
export function roleHasPermission(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  if (role === ROLES.ADMIN) return true;
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Default permissions for a role when the DB returns none (e.g. profile role_id unset). */
export function permissionsForRole(role: Role | null | undefined): Permission[] {
  if (!role) return [];
  if (role === ROLES.ADMIN) return [...ALL_PERMISSIONS];
  return [...ROLE_PERMISSIONS[role]];
}

/** Merge DB permissions with the static role fallback. */
export function effectivePermissions(
  role: Role | null | undefined,
  dbPermissions: readonly Permission[],
): Permission[] {
  if (role === ROLES.ADMIN) return [...ALL_PERMISSIONS];
  if (dbPermissions.length > 0) return [...dbPermissions];
  return permissionsForRole(role);
}

/** Permission check with DB list + static role fallback (admin always passes). */
export function hasEffectivePermission(
  role: Role | null | undefined,
  permissions: readonly Permission[],
  permission: Permission,
): boolean {
  if (!role) return false;
  if (role === ROLES.ADMIN) return true;
  if (permissions.includes(permission)) return true;
  return roleHasPermission(role, permission);
}

/** Type guard: is the given value a known permission code? */
export function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && (ALL_PERMISSIONS as readonly string[]).includes(value);
}
