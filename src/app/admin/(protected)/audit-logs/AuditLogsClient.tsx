"use client";

import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import { Select, fieldControlClasses } from "@/components/admin/FormField";

type AuditRow = {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  changed_by: string | null;
  created_at: string;
};

const TABLE_FILTERS = [
  "",
  "orders",
  "products",
  "inventory",
  "customers",
  "coupons",
  "returns",
  "shipments",
  "payments",
];

export default function AuditLogsClient({
  rows,
  error,
  filters,
}: {
  rows: AuditRow[];
  error: string | null;
  filters: { table: string; limit: string };
}) {
  const router = useRouter();

  function push(patch: Record<string, string>) {
    const sp = new URLSearchParams();
    const next = { table: filters.table, limit: filters.limit, ...patch };
    if (next.table) sp.set("table", next.table);
    if (next.limit) sp.set("limit", next.limit);
    router.push(`/admin/audit-logs?${sp.toString()}`);
  }

  const columns: Column<AuditRow>[] = [
    {
      key: "created",
      header: "When",
      render: (r) =>
        new Date(r.created_at).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    { key: "table", header: "Table", render: (r) => r.table_name },
    { key: "action", header: "Action", render: (r) => <span className="font-semibold text-green-900">{r.action}</span> },
    {
      key: "record",
      header: "Record",
      render: (r) => <span className="font-mono text-xs text-green-700">{r.record_id ?? "—"}</span>,
    },
    {
      key: "by",
      header: "Changed by",
      render: (r) => <span className="font-mono text-xs text-green-600">{r.changed_by ?? "system"}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          aria-label="Filter by table"
          value={filters.table}
          onChange={(e) => push({ table: e.target.value })}
          className="lg:w-48"
        >
          <option value="">All tables</option>
          {TABLE_FILTERS.filter(Boolean).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Row limit"
          value={filters.limit}
          onChange={(e) => push({ limit: e.target.value })}
          className="lg:w-32"
        >
          <option value="20">20 rows</option>
          <option value="50">50 rows</option>
          <option value="100">100 rows</option>
        </Select>
        <p className="text-sm text-green-600">{rows.length} shown</p>
      </div>

      {error ? (
        <p className="rounded-2xl bg-terra-50 px-4 py-3 text-sm text-terra-800" role="alert">
          {error}
        </p>
      ) : null}

      <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} empty="No audit events found." />
      <p className="text-xs text-green-600">
        API also available at <code className={fieldControlClasses + " inline px-1 py-0"}>GET /api/admin/audit-logs</code>{" "}
        for observability tooling.
      </p>
    </div>
  );
}
