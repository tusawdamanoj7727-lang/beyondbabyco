import "server-only";

import { jsonError, handleApiError } from "@/lib/api/route-helpers";
import { requireAdminApi } from "@/lib/api/route-helpers";
import { isServiceRoleConfigured } from "@/lib/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function requireAdminUserApi() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth;

  if (!isServiceRoleConfigured()) {
    return {
      ok: false as const,
      response: jsonError("Service unavailable", 503),
    };
  }

  return { ok: true as const, admin: createSupabaseServiceClient() };
}

export function handleAdminApiError(error: unknown) {
  return handleApiError(error, "admin-api");
}
