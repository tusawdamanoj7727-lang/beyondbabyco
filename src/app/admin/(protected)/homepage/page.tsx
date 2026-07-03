import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getHomepageAdminData } from "@/lib/admin/homepage";
import HomepageClient from "./HomepageClient";

export const metadata: Metadata = { title: "Homepage CMS" };

export default async function HomepageCmsPage() {
  await requirePermission(PERMISSIONS.CMS_MANAGE);

  const data = await getHomepageAdminData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Homepage CMS"
        description="Compose every section of the storefront homepage, manage hero slides and testimonials, then publish."
      />
      <HomepageClient data={data} />
    </div>
  );
}
