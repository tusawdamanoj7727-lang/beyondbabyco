import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import AICreativeLibrary from "@/components/campaigns/AICreativeLibrary";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function CampaignCreativePage() {
  await requirePermission(PERMISSIONS.MARKETING_MANAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing"
        title="AI Creative Library"
        description="Generate Instagram, Facebook, Google Ads, email headers, WhatsApp banners, and hero images."
        actions={
          <Link
            href="/admin/media"
            className="rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm font-semibold text-green-800 hover:bg-cream-50"
          >
            Media Library
          </Link>
        }
      />
      <div className="rounded-3xl border border-cream-200 bg-white p-6">
        <AICreativeLibrary campaignId={null} existingCreatives={[]} />
      </div>
    </div>
  );
}
