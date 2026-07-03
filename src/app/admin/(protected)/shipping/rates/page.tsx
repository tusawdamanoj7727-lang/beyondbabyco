import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getShippingFilterOptions, listRates } from "@/lib/admin/shipping";
import RatesClient from "./RatesClient";

export const metadata: Metadata = { title: "Shipping Rates" };

export default async function RatesPage() {
  await requirePermission(PERMISSIONS.SHIPPING_MANAGE);
  const [rates, options] = await Promise.all([listRates(), getShippingFilterOptions()]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Shipping" title="Shipping Rates" description="Weight slabs, pricing and COD charges by zone" actions={<Link href="/admin/shipping" className="inline-flex h-11 items-center rounded-3xl border border-green-200 px-4 text-sm font-medium text-green-800 hover:bg-green-50">← Shipping</Link>} />
      <RatesClient rates={rates} zones={options.zones} />
    </div>
  );
}
