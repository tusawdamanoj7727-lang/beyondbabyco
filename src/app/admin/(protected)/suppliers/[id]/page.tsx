import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getSupplierForEdit } from "@/lib/admin/suppliers";
import SupplierForm from "../SupplierForm";

export const metadata: Metadata = { title: "Edit Supplier" };

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  const { id } = await params;
  const supplier = await getSupplierForEdit(id);
  if (!supplier) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Inventory" title={supplier.name} description="Edit supplier details." />
      <SupplierForm mode="edit" initial={supplier} />
    </div>
  );
}
