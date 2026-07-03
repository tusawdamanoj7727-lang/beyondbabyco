import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import CustomerForm from "../CustomerForm";

export const metadata: Metadata = { title: "New Customer" };

export default async function NewCustomerPage() {
  await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Customers" title="Add Customer" description="Create a new customer profile" />
      <CustomerForm mode="create" />
    </div>
  );
}
