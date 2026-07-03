"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "../supabase/client";
import { useAuthContext } from "./auth-context";
import { isRole, type Role } from "./roles";
import { isPermission, type Permission } from "./permissions";

export interface UseAuthResult {
  user: ReturnType<typeof useAuthContext>["user"];
  session: ReturnType<typeof useAuthContext>["session"];
  loading: boolean;
  signOut: () => void;
  refresh: () => Promise<void>;
}

/** Client-side auth state — shared via AuthProvider. */
export function useAuth(): UseAuthResult {
  const { user, session, loading, signOut, refresh } = useAuthContext();
  return { user, session, loading, signOut, refresh };
}

export interface UseRoleResult {
  role: Role | null;
  permissions: Permission[];
  loading: boolean;
  isStaff: boolean;
  hasPermission: (permission: Permission) => boolean;
}

/**
 * Client-side role + permission state, resolved via the auth helper RPCs.
 */
export function useRole(): UseRoleResult {
  const { session, loading: authLoading } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (authLoading) return;

    if (!session) {
      setRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([
      supabase.rpc("current_user_role"),
      supabase.rpc("current_user_permissions"),
    ]).then(([roleRes, permsRes]) => {
      if (!active) return;
      setRole(isRole(roleRes.data) ? roleRes.data : null);
      setPermissions(
        Array.isArray(permsRes.data) ? permsRes.data.filter(isPermission) : [],
      );
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [session, authLoading]);

  const hasPermission = useCallback(
    (permission: Permission) =>
      role === "admin" || permissions.includes(permission),
    [role, permissions],
  );

  return {
    role,
    permissions,
    loading: loading || authLoading,
    isStaff: role === "admin" || role === "manager" || role === "support",
    hasPermission,
  };
}
