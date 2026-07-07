import type { User } from "@supabase/supabase-js";

/**
 * Role definitions — mirrors the `roles` table seeded in
 * `supabase/database/005_seed.sql`.
 */
export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  SUPPORT: "support",
  CUSTOMER: "customer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: readonly Role[] = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.SUPPORT,
  ROLES.CUSTOMER,
];

/** Roles that may access the admin area. */
export const STAFF_ROLES: readonly Role[] = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.SUPPORT,
];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  manager: "Manager",
  support: "Support",
  customer: "Customer",
};

/**
 * Privilege ranking for "at least this role" comparisons.
 * Higher number = more privileged.
 */
export const ROLE_RANK: Record<Role, number> = {
  customer: 0,
  support: 1,
  manager: 2,
  admin: 3,
};

/** Metadata / legacy role strings that map to app roles. */
const METADATA_ADMIN_ALIASES = new Set(["admin", "super_admin"]);

/** Type guard: is the given value a known role? */
export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ALL_ROLES as readonly string[]).includes(value);
}

/** Normalize DB or metadata role strings (e.g. super_admin → admin). */
export function normalizeRole(value: unknown): Role | null {
  if (typeof value !== "string") return null;
  if (value === "super_admin" || value === "admin") return ROLES.ADMIN;
  if (value === "editor") return ROLES.MANAGER;
  if (value === "viewer") return ROLES.SUPPORT;
  return isRole(value) ? value : null;
}

function metadataRecord(user: User | null | undefined): Record<string, unknown> {
  if (!user) return {};
  return {
    ...(typeof user.app_metadata === "object" && user.app_metadata
      ? user.app_metadata
      : {}),
    ...(typeof user.user_metadata === "object" && user.user_metadata
      ? user.user_metadata
      : {}),
  };
}

function metadataFlag(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

/** Resolve a staff role from Supabase user metadata when the profile row is missing or customer. */
export function roleFromUserMetadata(user: User | null | undefined): Role | null {
  const meta = metadataRecord(user);

  const roleClaim = meta.role;
  if (typeof roleClaim === "string") {
    const normalized = normalizeRole(roleClaim);
    if (normalized && isStaffRole(normalized)) return normalized;
    if (METADATA_ADMIN_ALIASES.has(roleClaim)) return ROLES.ADMIN;
  }

  if (metadataFlag(meta.is_admin)) return ROLES.ADMIN;

  return null;
}

/**
 * Prefer the profile role from `current_user_role()`; fall back to JWT metadata
 * when the profile is unset or only grants customer access.
 */
export function resolveEffectiveRole(
  dbRole: unknown,
  user?: User | null,
): Role | null {
  const fromDb = normalizeRole(dbRole);
  if (fromDb && isStaffRole(fromDb)) return fromDb;

  const fromMeta = roleFromUserMetadata(user);
  if (fromMeta) return fromMeta;

  return fromDb;
}

/** Is the role a staff role (admin / manager / support)? */
export function isStaffRole(role: Role | null | undefined): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

/** Does `role` rank at least as high as `minimum`? */
export function roleAtLeast(role: Role | null | undefined, minimum: Role): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}
