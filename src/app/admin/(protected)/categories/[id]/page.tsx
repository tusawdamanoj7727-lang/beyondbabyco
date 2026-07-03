import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCategoryForEdit, getCategoryOptions } from "@/lib/admin/categories";
import type { ProductStatus } from "@/lib/supabase/database.types";
import CategoryForm from "../CategoryForm";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.CATALOG_MANAGE);

  const { id } = await params;
  const [category, categories] = await Promise.all([
    getCategoryForEdit(id),
    getCategoryOptions(),
  ]);

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Categories / Edit"
        title={category.name}
        description={`/${category.slug}`}
        actions={<StatusBadge status={category.status as ProductStatus} size="md" />}
      />
      <CategoryForm mode="edit" initial={category} categories={categories} />
    </div>
  );
}
