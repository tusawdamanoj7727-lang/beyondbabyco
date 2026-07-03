import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import FinanceNav from "@/components/admin/finance/FinanceNav";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Accounting & Finance" };

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.FINANCE_VIEW);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Finance" title="Accounting & Finance" description="Expenses, ledger, GST, vendors and bank reconciliation" />
      <FinanceNav />
      {children}
    </div>
  );
}
