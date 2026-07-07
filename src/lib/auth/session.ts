import "server-only";

import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "../env";
import { createSupabaseServerClient } from "../supabase/server";
import { isRole, resolveEffectiveRole, type Role } from "./roles";
import { isPermission, type Permission } from "./permissions";

export interface Profile {
  id: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  roleId: string | null;
}

export interface AuthContext {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  permissions: Permission[];
}

/** The authenticated Supabase user, validated against the auth server. */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Session for client hydration — validated via getUser first. */
export async function getServerSession() {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/** The signed-in user's profile row, or null when unauthenticated. */
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone, avatar_url, is_active, role_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return null;

  const row = data as {
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    is_active: boolean;
    role_id: string | null;
  };

  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    isActive: row.is_active,
    roleId: row.role_id,
  };
}

/** The signed-in user's role name, resolved via RPC with metadata fallback. */
export async function getCurrentRole(): Promise<Role | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase.rpc("current_user_role");

  if (error) return roleFromSessionUser(user);
  return resolveEffectiveRole(data, user);
}

function roleFromSessionUser(user: User | null): Role | null {
  if (!user) return null;
  return resolveEffectiveRole(null, user);
}

/** The signed-in user's flattened permission codes. */
export async function getCurrentPermissions(): Promise<Permission[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("current_user_permissions");

  if (error || !Array.isArray(data)) return [];
  return data.filter(isPermission);
}

/** Convenience: load the full auth context in one call. */
export async function getAuthContext(): Promise<AuthContext> {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, profile: null, role: null, permissions: [] };
  }

  const [profile, role, permissions] = await Promise.all([
    getCurrentProfile(),
    getCurrentRole(),
    getCurrentPermissions(),
  ]);

  return { user, profile, role, permissions };
}
