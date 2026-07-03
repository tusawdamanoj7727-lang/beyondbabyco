import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import MarketingNav from "@/components/admin/marketing/MarketingNav";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Marketing Automation" };

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.MARKETING_VIEW);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Marketing" title="Marketing Automation" description="Campaigns, segments, loyalty and automation workflows" />
      <MarketingNav />
      {children}
    </div>
  );
}
