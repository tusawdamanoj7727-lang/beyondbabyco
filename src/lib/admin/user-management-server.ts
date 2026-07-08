import "server-only";

import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

import {
  isUserPanelRole,
  panelRoleToDbRole,
  type AdminUserRow,
  type UserPanelRole,
} from "./user-management";

export { isUserPanelRole };

function resolvePanelRole(
  user: User,
  profile?: { roleName?: string | null; isActive?: boolean },
): UserPanelRole {
  const metaRole = user.user_metadata?.role;
  if (isUserPanelRole(metaRole)) return metaRole;

  if (profile?.roleName === "admin") return "admin";
  if (profile?.roleName === "manager") return "editor";
  if (profile?.roleName === "support") return "viewer";

  if (user.user_metadata?.is_admin === true) return "super_admin";

  return "viewer";
}

function isUserDeactivated(user: User, profile?: { isActive?: boolean }): boolean {
  if (profile?.isActive === false) return true;
  if (user.banned_until) {
    const bannedUntil = new Date(user.banned_until);
    return bannedUntil.getTime() > Date.now();
  }
  return false;
}

export function buildAdminUserRow(
  user: User,
  profile?: {
    full_name?: string | null;
    is_active?: boolean;
    roles?: { name: string } | { name: string }[] | null;
  },
): AdminUserRow {
  const roleRelation = profile?.roles;
  const roleName = Array.isArray(roleRelation)
    ? roleRelation[0]?.name
    : roleRelation?.name;

  const name =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    profile?.full_name ||
    null;

  return {
    id: user.id,
    email: user.email ?? "",
    name,
    role: resolvePanelRole(user, { roleName, isActive: profile?.is_active }),
    joinedAt: user.created_at,
    lastLoginAt: user.last_sign_in_at ?? null,
    isActive: !isUserDeactivated(user, { isActive: profile?.is_active }),
  };
}

async function getDbRoleId(
  admin: SupabaseClient<Database>,
  panelRole: UserPanelRole,
): Promise<string> {
  const dbRole = panelRoleToDbRole(panelRole);
  const { data, error } = await admin.from("roles").select("id").eq("name", dbRole).single();
  if (error || !data) {
    throw new Error(`Role "${dbRole}" not found. Run npm run bootstrap:admin.`);
  }
  return data.id;
}

export async function syncUserAccess(
  admin: SupabaseClient<Database>,
  userId: string,
  panelRole: UserPanelRole,
  options?: { fullName?: string; isActive?: boolean },
): Promise<void> {
  const roleId = await getDbRoleId(admin, panelRole);
  const fullName = options?.fullName?.trim();
  const isActive = options?.isActive ?? true;

  const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      role: panelRole,
      is_admin: panelRole === "super_admin" || panelRole === "admin",
      ...(fullName ? { full_name: fullName } : {}),
    },
    ...(isActive ? { ban_duration: "none" } : {}),
  });
  if (metaError) throw new Error(metaError.message);

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      role_id: roleId,
      ...(fullName ? { full_name: fullName } : {}),
      is_active: isActive,
    },
    { onConflict: "id" },
  );
  if (profileError) throw new Error(profileError.message);
}

export function generateTemporaryPassword(length = 14): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
