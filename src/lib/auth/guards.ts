import "server-only";

import { redirect } from "next/navigation";

import {
  getCurrentPermissions,
  getCurrentProfile,
  getCurrentRole,
  getCurrentUser,
  getAuthContext,
  type AuthContext,
} from "./session";
import { ROLES, isStaffRole, roleAtLeast, type Role } from "./roles";
import { type Permission } from "./permissions";

const LOGIN_PATH = "/admin/login";

function rejectInactiveStaff(ctx: AuthContext): void {
  if (ctx.profile && !ctx.profile.isActive) {
    redirect(LOGIN_PATH);
  }
}

/** Does the current user have the given role? */
export async function hasRole(role: Role): Promise<boolean> {
  const current = await getCurrentRole();
  return current === role;
}

/** Does the current user rank at least as high as `minimum`? */
export async function hasRoleAtLeast(minimum: Role): Promise<boolean> {
  return roleAtLeast(await getCurrentRole(), minimum);
}

/** Does the current user hold the given permission (per the database)? */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const role = await getCurrentRole();
  if (role === ROLES.ADMIN) return true;
  const permissions = await getCurrentPermissions();
  return permissions.includes(permission);
}

/**
 * Require an authenticated user; redirect to the login page otherwise.
 * Returns the full auth context for convenience.
 */
export async function requireAuth(): Promise<AuthContext> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  return getAuthContext();
}

/** Require any staff role (admin / manager / support) with an active profile. */
export async function requireStaff(): Promise<AuthContext> {
  const ctx = await requireAuth();
  rejectInactiveStaff(ctx);
  if (!isStaffRole(ctx.role)) redirect(LOGIN_PATH);
  return ctx;
}

/** Require manager-or-above (manager, admin). */
export async function requireManager(): Promise<AuthContext> {
  const ctx = await requireAuth();
  rejectInactiveStaff(ctx);
  if (!roleAtLeast(ctx.role, ROLES.MANAGER)) redirect(LOGIN_PATH);
  return ctx;
}

/** Require the admin role. */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireAuth();
  rejectInactiveStaff(ctx);
  if (ctx.role !== ROLES.ADMIN) redirect(LOGIN_PATH);
  return ctx;
}

/** Require a specific permission; redirect to login when missing. */
export async function requirePermission(permission: Permission): Promise<AuthContext> {
  const ctx = await requireStaff();
  const granted =
    ctx.role === ROLES.ADMIN || ctx.permissions.includes(permission);
  if (!granted) redirect(LOGIN_PATH);
  return ctx;
}

/** API-oriented: returns false when profile is missing or deactivated. */
export async function isActiveAuthenticatedUser(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const profile = await getCurrentProfile();
  return profile?.isActive !== false;
}
