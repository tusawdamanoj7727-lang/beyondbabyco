import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import SupplierForm from "../SupplierForm";

export const metadata: Metadata = { title: "New Supplier" };

export default async function NewSupplierPage() {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Inventory" title="New Supplier" description="Add a vendor for purchase orders." />
      <SupplierForm mode="create" initial={null} />
    </div>
  );
}
