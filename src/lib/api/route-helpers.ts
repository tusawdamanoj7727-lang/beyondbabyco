import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentPermissions, getCurrentRole } from "@/lib/auth/session";
import { ROLES, isStaffRole } from "@/lib/auth/roles";
import type { Permission } from "@/lib/auth/permissions";

export function jsonOk<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** Staff API guard — returns 403 JSON instead of redirect. */
export async function requireStaffApi(permission?: Permission): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: jsonError("Unauthorized", 401) };

  const role = await getCurrentRole();
  if (!isStaffRole(role)) {
    return { ok: false, response: jsonError("Forbidden", 403) };
  }

  if (permission && role !== ROLES.ADMIN) {
    const permissions = await getCurrentPermissions();
    if (!permissions.includes(permission)) {
      return { ok: false, response: jsonError("Forbidden", 403) };
    }
  }

  return { ok: true };
}

/** Admin-only API guard — returns 403 JSON for non-admin staff. */
export async function requireAdminApi(): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: jsonError("Unauthorized", 401) };

  const role = await getCurrentRole();
  if (role !== ROLES.ADMIN) {
    return { ok: false, response: jsonError("Forbidden", 403) };
  }

  return { ok: true };
}

export async function requireAuthenticatedApi(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: jsonError("Unauthorized", 401) };
  return { ok: true, userId: user.id };
}
