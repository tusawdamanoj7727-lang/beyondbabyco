import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getBanner } from "@/lib/admin/banners";
import { getCampaignCenterOverview } from "@/lib/admin/campaign-center";

import BannerFormClient from "../BannerFormClient";

export const metadata: Metadata = { title: "Edit Banner" };

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const { id } = await params;
  const [banner, overview] = await Promise.all([getBanner(id), getCampaignCenterOverview()]);
  if (!banner) notFound();

  const campaigns = overview.campaigns
    .filter((c) => !c.id.startsWith("demo-"))
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Marketing" title={banner.title || "Edit banner"} description="Update creatives, schedule, and publish state." />
      <BannerFormClient initial={banner} campaigns={campaigns} />
    </div>
  );
}
