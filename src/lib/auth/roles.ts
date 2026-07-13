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

/** Type guard: is the given value a known role? */
export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ALL_ROLES as readonly string[]).includes(value);
}

/** Normalize DB role strings (e.g. super_admin → admin). */
export function normalizeRole(value: unknown): Role | null {
  if (typeof value !== "string") return null;
  if (value === "super_admin" || value === "admin") return ROLES.ADMIN;
  if (value === "editor") return ROLES.MANAGER;
  if (value === "viewer") return ROLES.SUPPORT;
  return isRole(value) ? value : null;
}

/**
 * @deprecated Client-controlled user_metadata is never trusted for authorization.
 * Roles are resolved exclusively from `profiles.role_id` via `current_user_role()`.
 */
export function roleFromUserMetadata(_user: User | null | undefined): Role | null {
  return null;
}

/**
 * Resolve role from trusted server data only (`profiles.role_id` / RPC).
 * Never reads JWT user_metadata — prevents client-side privilege escalation.
 */
export function resolveEffectiveRole(dbRole: unknown, _user?: User | null): Role | null {
  return normalizeRole(dbRole);
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
