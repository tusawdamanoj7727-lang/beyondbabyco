import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCategoryOptions } from "@/lib/admin/categories";
import CategoryForm from "../CategoryForm";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage() {
  await requirePermission(PERMISSIONS.CATALOG_MANAGE);
  const categories = await getCategoryOptions();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Categories"
        title="Add category"
        description="Create a new category. You can nest it under a parent and upload media."
      />
      <CategoryForm mode="create" initial={null} categories={categories} />
    </div>
  );
}
