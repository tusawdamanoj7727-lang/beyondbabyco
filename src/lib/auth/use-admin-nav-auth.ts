"use client";

import { useCallback, useMemo } from "react";

import { useAdmin } from "@/components/admin/context";
import {
  effectivePermissions,
  hasEffectivePermission,
  type Permission,
} from "@/lib/auth/permissions";
import { useRole } from "@/lib/auth/hooks";
import type { Role } from "@/lib/auth/roles";

/**
 * Admin nav auth — merges SSR context (requireStaff) with client RPC results.
 * Prevents the sidebar from collapsing to Dashboard-only when client RPCs
 * return null/empty but the server already validated staff access.
 */
export function useAdminNavAuth() {
  const { role: serverRole, permissions: serverPermissions } = useAdmin();
  const {
    role: clientRole,
    permissions: clientPermissions,
    loading: clientLoading,
  } = useRole();

  const role: Role | null = clientRole ?? serverRole;

  const permissions = useMemo(
    () =>
      effectivePermissions(
        role,
        clientPermissions.length > 0 ? clientPermissions : serverPermissions,
      ),
    [role, clientPermissions, serverPermissions],
  );

  const hasPermission = useCallback(
    (permission: Permission) => hasEffectivePermission(role, permissions, permission),
    [role, permissions],
  );

  return {
    role,
    permissions,
    hasPermission,
    loading: clientLoading,
  };
}
