import { notFound } from "next/navigation";
import dynamic from "next/dynamic";

import PageHeader from "@/components/admin/PageHeader";
import ModuleLoading from "@/components/ui/ModuleLoading";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listCoupons } from "@/lib/admin/coupons";
import { getCampaignCenterItem } from "@/lib/admin/campaign-center";
import { getMarketingFilterOptions } from "@/lib/admin/marketing";
import { DEMO_CAMPAIGNS } from "@/lib/campaigns/demo-campaigns";

const CampaignBuilderClient = dynamic(() => import("@/components/campaigns/CampaignBuilderClient"), {
  loading: () => <ModuleLoading label="Loading campaign builder…" />,
});

export default async function CampaignEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.MARKETING_MANAGE);
  const { id } = await params;

  let campaign = await getCampaignCenterItem(id);
  if (!campaign && id.startsWith("demo-")) {
    campaign = DEMO_CAMPAIGNS.find((d) => d.id === id) ?? null;
  }
  if (!campaign) notFound();

  const [coupons, options] = await Promise.all([
    listCoupons({ page: 1, perPage: 50 }),
    getMarketingFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={campaign.name} description="Edit campaign content, placement, coupons, and preview." />
      <CampaignBuilderClient
        campaign={campaign}
        coupons={coupons.rows}
        segments={options.segments}
        templates={options.templates}
      />
    </div>
  );
}
