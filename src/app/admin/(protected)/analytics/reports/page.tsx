import Link from "next/link";

import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listReportExports, listSavedReports, listScheduledReports } from "@/lib/admin/reports";
import ReportsOverviewClient from "@/app/admin/(protected)/reports/ReportsOverviewClient";

const REPORT_LINKS = [
  { href: "/admin/analytics/sales", label: "Sales", types: ["sales", "orders"] },
  { href: "/admin/analytics/customers", label: "Customers", types: ["customers"] },
  { href: "/admin/analytics/products", label: "Products & Inventory", types: ["products", "inventory"] },
  { href: "/admin/analytics/marketing", label: "Marketing & Coupons", types: ["marketing"] },
  { href: "/admin/analytics/shipping", label: "Shipping", types: ["shipping"] },
  { href: "/admin/analytics/payments", label: "Payments", types: ["payments"] },
  { href: "/admin/reports/returns", label: "Returns", types: ["returns"] },
  { href: "/admin/reports/reviews", label: "Reviews", types: ["reviews"] },
  { href: "/admin/reports/finance", label: "Finance", types: ["finance"] },
] as const;

export default async function AnalyticsReportsHubPage() {
  const ctx = await getAuthContext();
  const canManage = ctx.role === "admin" || (await hasPermission(PERMISSIONS.ANALYTICS_MANAGE));

  const [saved, scheduled, exports] = await Promise.all([
    listSavedReports(ctx.user?.id),
    listScheduledReports(),
    listReportExports(ctx.user?.id),
  ]);

  return (
    <div className="space-y-8">
      <section aria-labelledby="export-formats-heading">
        <h2 id="export-formats-heading" className="font-heading text-lg font-bold text-green-900 dark:text-cream-50">
          Export formats
        </h2>
        <p className="mt-1 text-sm text-green-700/70 dark:text-green-200/70">
          CSV, Excel, PDF, and print exports are available from each analytics page via the Export menu.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex h-full flex-col rounded-2xl border border-cream-200 bg-white p-4 transition-shadow hover:shadow-card dark:border-green-800 dark:bg-green-950/40"
              >
                <span className="font-heading font-bold text-green-900 dark:text-cream-50">{link.label}</span>
                <span className="mt-1 text-xs text-green-700/60 dark:text-green-200/60">
                  Export {link.types.join(", ")} data
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ReportsOverviewClient saved={saved} scheduled={scheduled} exports={exports} canManage={canManage} />
    </div>
  );
}
