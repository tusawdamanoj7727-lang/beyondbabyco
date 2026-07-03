import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getWarehouseForEdit } from "@/lib/admin/warehouses";
import WarehouseForm from "../WarehouseForm";

export const metadata: Metadata = { title: "Edit Warehouse" };

export default async function EditWarehousePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  const { id } = await params;
  const warehouse = await getWarehouseForEdit(id);
  if (!warehouse) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Inventory" title={warehouse.name} description="Edit warehouse details." />
      <WarehouseForm mode="edit" initial={warehouse} />
    </div>
  );
}
