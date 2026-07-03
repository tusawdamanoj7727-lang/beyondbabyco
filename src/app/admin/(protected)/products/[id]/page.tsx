import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getProductForEdit, getProductFormOptions } from "@/lib/admin/products";
import ProductForm from "../ProductForm";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.CATALOG_MANAGE);

  const { id } = await params;
  const [product, options] = await Promise.all([
    getProductForEdit(id),
    getProductFormOptions(),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Products / Edit"
        title={product.name}
        description={`/${product.slug}`}
        actions={<StatusBadge status={product.status} size="md" />}
      />
      <ProductForm mode="edit" initial={product} options={options} />
    </div>
  );
}
