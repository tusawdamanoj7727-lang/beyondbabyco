import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Exports" };

const RESOURCES = [
  {
    id: "orders",
    label: "Orders",
    description: "Order number, customer, status, payment, totals (last 5,000)",
  },
  {
    id: "customers",
    label: "Customers",
    description: "Customer CRM export (CSV)",
    href: "/admin/customers/export",
  },
  {
    id: "products",
    label: "Products",
    description: "Catalog products with price and status",
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "On-hand, reserved, available, reorder levels",
  },
  {
    id: "coupons",
    label: "Coupons",
    description: "Codes, usage counts, revenue, expiry",
  },
] as const;

export default async function AdminExportsPage() {
  await requirePermission(PERMISSIONS.REPORTS_VIEW);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Reporting"
        title="Data Exports"
        description="Download CSV or Excel (.xls SpreadsheetML) for ops and accounting. Exports are audited."
      />

      <ul className="grid gap-4 sm:grid-cols-2">
        {RESOURCES.map((r) => (
          <li key={r.id} className="rounded-3xl border border-green-100 bg-white/90 p-5 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-green-900">{r.label}</h2>
            <p className="mt-1 text-sm text-green-700">{r.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {"href" in r && r.href ? (
                <Link
                  href={r.href}
                  className="inline-flex h-10 items-center rounded-full bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-800"
                >
                  Download CSV
                </Link>
              ) : (
                <>
                  <Link
                    href={`/admin/exports/download?resource=${r.id}&format=csv`}
                    className="inline-flex h-10 items-center rounded-full bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-800"
                  >
                    CSV
                  </Link>
                  <Link
                    href={`/admin/exports/download?resource=${r.id}&format=excel`}
                    className="inline-flex h-10 items-center rounded-full border border-green-200 px-4 text-sm font-semibold text-green-800 hover:bg-green-50"
                  >
                    Excel (.xls)
                  </Link>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-green-600">
        Tip: charted reports remain under{" "}
        <Link href="/admin/reports" className="font-semibold text-terra-600 hover:underline">
          Reports
        </Link>{" "}
        and{" "}
        <Link href="/admin/analytics" className="font-semibold text-terra-600 hover:underline">
          Analytics
        </Link>
        .
      </p>
    </div>
  );
}
