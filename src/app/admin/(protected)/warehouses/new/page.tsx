import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import WarehouseForm from "../WarehouseForm";

export const metadata: Metadata = { title: "New Warehouse" };

export default async function NewWarehousePage() {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Inventory" title="New Warehouse" description="Add a stock location." />
      <WarehouseForm mode="create" initial={null} />
    </div>
  );
}
