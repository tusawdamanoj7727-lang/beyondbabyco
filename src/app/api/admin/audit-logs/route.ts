import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

/** Read-only audit log API for observability (no UI changes). */
export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const table = url.searchParams.get("table");

  const supabase = await createSupabaseServerClient();
  let q = supabase.from("audit_logs").select("id, table_name, record_id, action, changed_by, created_at").order("created_at", { ascending: false }).limit(limit);
  if (table) q = q.eq("table_name", table);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rows: data ?? [], count: data?.length ?? 0 });
}
