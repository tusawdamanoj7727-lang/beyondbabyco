import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listBanners } from "@/lib/admin/banners";

import BannersClient from "./BannersClient";

export const metadata: Metadata = { title: "Banner Manager" };

export default async function BannersPage() {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const { rows, dashboard } = await listBanners();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Marketing"
        title="Banner Manager"
        description="Create, schedule, and publish storefront banners across desktop, tablet, and mobile."
        actions={
          <Link
            href="/admin/banners/new"
            className="inline-flex h-12 items-center gap-2 rounded-3xl bg-green-500 px-6 font-medium text-cream-50 shadow-clay transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500 focus-visible:ring-offset-2"
          >
            <Icon name="plus" size={18} />
            Create Banner
          </Link>
        }
      />
      <BannersClient rows={rows} dashboard={dashboard} />
    </div>
  );
}
