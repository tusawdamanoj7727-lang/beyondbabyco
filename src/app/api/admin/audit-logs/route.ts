import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseLimit } from "@/lib/api/schemas";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { handleApiError, jsonOk, requireStaffApi } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

/** Read-only audit log API for observability. */
export async function GET(request: Request) {
  const auth = await requireStaffApi(PERMISSIONS.SETTINGS_MANAGE);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams, { max: 100, default: 50 });
  const table = url.searchParams.get("table");

  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("audit_logs")
    .select("id, table_name, record_id, action, changed_by, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (table) q = q.eq("table_name", table);

  const { data, error } = await q;
  if (error) return handleApiError(error, "admin.audit-logs");

  return jsonOk({ rows: data ?? [], count: data?.length ?? 0 });
}
