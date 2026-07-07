import "server-only";

import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api/route-helpers";
import { requireAdminApi } from "@/lib/api/route-helpers";
import { isServiceRoleConfigured } from "@/lib/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function requireAdminUserApi() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth;

  if (!isServiceRoleConfigured()) {
    return {
      ok: false as const,
      response: jsonError(
        "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local.",
        503,
      ),
    };
  }

  return { ok: true as const, admin: createSupabaseServiceClient() };
}

export function handleAdminApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}
