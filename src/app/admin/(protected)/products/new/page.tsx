import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getProductFormOptions } from "@/lib/admin/products";
import ProductForm from "../ProductForm";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requirePermission(PERMISSIONS.CATALOG_MANAGE);
  const options = await getProductFormOptions();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Products"
        title="Add product"
        description="Create a new product in your catalog. You can manage media after saving."
      />
      <ProductForm mode="create" initial={null} options={options} />
    </div>
  );
}
