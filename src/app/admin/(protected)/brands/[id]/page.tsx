import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getBrandForEdit } from "@/lib/admin/brands";
import type { ProductStatus } from "@/lib/supabase/database.types";
import BrandForm from "../BrandForm";

export const metadata: Metadata = { title: "Edit brand" };

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.CATALOG_MANAGE);

  const { id } = await params;
  const brand = await getBrandForEdit(id);
  if (!brand) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Brands / Edit"
        title={brand.name}
        description={`/${brand.slug}`}
        actions={<StatusBadge status={brand.status as ProductStatus} size="md" />}
      />
      <BrandForm mode="edit" initial={brand} />
    </div>
  );
}
