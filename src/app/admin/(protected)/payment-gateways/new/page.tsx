import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import GatewayForm from "../GatewayForm";

export const metadata: Metadata = { title: "New Payment Gateway" };

export default async function NewPaymentGatewayPage() {
  await requirePermission(PERMISSIONS.PAYMENTS_MANAGE);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Finance" title="Add payment gateway" description="Configure a new payment provider adapter" />
      <GatewayForm mode="create" initial={null} />
    </div>
  );
}
