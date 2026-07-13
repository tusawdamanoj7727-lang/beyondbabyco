import { NextResponse } from "next/server";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { getCurrentPermissions, getCurrentRole } from "@/lib/auth/session";
import { ROLES, isStaffRole } from "@/lib/auth/roles";
import type { Permission } from "@/lib/auth/permissions";
import { logger } from "@/lib/observability/logger";

export type ApiResponse<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** Log provider/internal failures; return a generic client message. */
export function handleApiError(error: unknown, context: string): NextResponse {
  logger.error("api.error", {
    context,
    error: error instanceof Error ? error.message : String(error),
  });
  return jsonError("Request failed", 500);
}

async function requireActiveProfile(): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  const profile = await getCurrentProfile();
  if (profile && !profile.isActive) {
    return { ok: false, response: jsonError("Account deactivated", 403) };
  }
  return { ok: true };
}

/** Staff API guard — returns 403 JSON instead of redirect. */
export async function requireStaffApi(permission?: Permission): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: jsonError("Unauthorized", 401) };

  const active = await requireActiveProfile();
  if (!active.ok) return active;

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

  const active = await requireActiveProfile();
  if (!active.ok) return active;

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

  const active = await requireActiveProfile();
  if (!active.ok) return active;

  return { ok: true, userId: user.id };
}
