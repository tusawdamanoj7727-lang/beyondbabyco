import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import AnalyticsNav from "@/components/admin/analytics/AnalyticsNav";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.REPORTS_VIEW);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Business Intelligence"
        title="Analytics"
        description="Executive dashboards, operational insights, and exportable reports"
      />
      <AnalyticsNav />
      {children}
    </div>
  );
}
