import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCampaignCenterOverview } from "@/lib/admin/campaign-center";

import BannerFormClient from "../BannerFormClient";

export const metadata: Metadata = { title: "New Banner" };

export default async function NewBannerPage() {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const overview = await getCampaignCenterOverview();
  const campaigns = overview.campaigns
    .filter((c) => !c.id.startsWith("demo-"))
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Marketing" title="New banner" description="Upload creatives, set CTA, schedule, and preview." />
      <BannerFormClient initial={null} campaigns={campaigns} />
    </div>
  );
}
