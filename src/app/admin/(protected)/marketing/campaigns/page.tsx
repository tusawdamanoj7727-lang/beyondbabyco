import Link from "next/link";
import dynamic from "next/dynamic";

import PageHeader from "@/components/admin/PageHeader";
import ModuleLoading from "@/components/ui/ModuleLoading";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCampaignCenterOverview } from "@/lib/admin/campaign-center";

const CampaignCenterClient = dynamic(() => import("./CampaignCenterClient"), {
  loading: () => <ModuleLoading label="Loading campaign center…" />,
});

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requirePermission(PERMISSIONS.MARKETING_VIEW);
  const sp = await searchParams;
  const view = sp.view === "all" ? "all" : "overview";
  const overview = await getCampaignCenterOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing"
        title="Campaign Center"
        description="Plan, build, and preview marketing campaigns across channels, homepage slots, and landing pages."
        actions={
          <Link
            href="/admin/communications"
            className="rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm font-semibold text-green-800 hover:bg-cream-50"
          >
            Email templates
          </Link>
        }
      />
      <CampaignCenterClient overview={overview} view={view} />
    </div>
  );
}
