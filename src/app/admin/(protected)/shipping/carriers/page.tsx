import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listCarriers } from "@/lib/admin/shipping";
import CarriersClient from "./CarriersClient";

export const metadata: Metadata = { title: "Shipping Carriers" };

export default async function CarriersPage() {
  await requirePermission(PERMISSIONS.SHIPPING_MANAGE);
  const carriers = await listCarriers();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Shipping"
        title="Carriers"
        description="Configure courier integrations and API credentials"
        actions={
          <Link href="/admin/shipping" className="inline-flex h-11 items-center rounded-3xl border border-green-200 px-4 text-sm font-medium text-green-800 hover:bg-green-50">← Shipping</Link>
        }
      />
      <CarriersClient carriers={carriers} />
    </div>
  );
}
