import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import BrandForm from "../BrandForm";

export const metadata: Metadata = { title: "New brand" };

export default async function NewBrandPage() {
  await requirePermission(PERMISSIONS.CATALOG_MANAGE);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Brands"
        title="Add brand"
        description="Create a new brand and upload its logo and banner."
      />
      <BrandForm mode="create" initial={null} />
    </div>
  );
}
