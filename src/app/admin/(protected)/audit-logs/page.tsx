import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AuditLogsClient from "./AuditLogsClient";

export const metadata: Metadata = { title: "Audit Logs" };

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
  const sp = await searchParams;
  const table = sp.table?.trim() || "";
  const limit = Math.min(100, Math.max(20, Number(sp.limit) || 50));

  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("audit_logs")
    .select("id, table_name, record_id, action, changed_by, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (table) q = q.eq("table_name", table);

  const { data, error } = await q;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Security"
        title="Audit Logs"
        description="Staff mutations across orders, inventory, customers, and settings"
      />
      <AuditLogsClient
        rows={data ?? []}
        error={error?.message ?? null}
        filters={{ table, limit: String(limit) }}
      />
    </div>
  );
}
