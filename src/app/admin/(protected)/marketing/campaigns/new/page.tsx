import PageHeader from "@/components/admin/PageHeader";
import dynamic from "next/dynamic";
import ModuleLoading from "@/components/ui/ModuleLoading";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listCoupons } from "@/lib/admin/coupons";
import { getMarketingFilterOptions } from "@/lib/admin/marketing";

const CampaignBuilderClient = dynamic(() => import("@/components/campaigns/CampaignBuilderClient"), {
  loading: () => <ModuleLoading label="Loading campaign builder…" />,
});

export default async function NewCampaignPage() {
  await requirePermission(PERMISSIONS.MARKETING_MANAGE);

  const [coupons, options] = await Promise.all([
    listCoupons({ page: 1, perPage: 50 }),
    getMarketingFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="New campaign" description="Build a marketing campaign with homepage slots, coupons, and AI creatives." />
      <CampaignBuilderClient campaign={null} coupons={coupons.rows} segments={options.segments} templates={options.templates} />
    </div>
  );
}
