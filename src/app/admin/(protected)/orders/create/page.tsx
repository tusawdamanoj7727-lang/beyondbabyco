import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getOrderFilterOptions, getVariantOptionsForOrder } from "@/lib/admin/orders";
import CreateOrderClient from "./CreateOrderClient";

export const metadata: Metadata = { title: "Create Order" };

export default async function CreateOrderPage() {
  await requirePermission(PERMISSIONS.ORDERS_MANAGE);

  const [options, variants] = await Promise.all([getOrderFilterOptions(), getVariantOptionsForOrder()]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Orders" title="Create Order" description="Create a draft or pending order manually" />
      <CreateOrderClient warehouses={options.warehouses} customers={options.customers} shippingMethods={options.shippingMethods} variants={variants} />
    </div>
  );
}
