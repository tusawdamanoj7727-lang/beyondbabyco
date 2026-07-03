import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import ReportsNav from "@/components/admin/reports/ReportsNav";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Reports & Analytics" };

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.REPORTS_VIEW);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Analytics"
        title="Reports & Analytics"
        description="Executive dashboards, operational reports and scheduled exports"
      />
      <ReportsNav />
      {children}
    </div>
  );
}
