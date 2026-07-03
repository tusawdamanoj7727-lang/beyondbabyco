import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getPaymentGatewayDetail, getSettlementSummary } from "@/lib/admin/payments";
import GatewayDetailClient from "./GatewayDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const gateway = await getPaymentGatewayDetail(id);
  return { title: gateway ? gateway.displayName : "Payment Gateway" };
}

export default async function PaymentGatewayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.PAYMENTS_MANAGE);
  const { id } = await params;

  const [gateway, settlement] = await Promise.all([
    getPaymentGatewayDetail(id),
    getSettlementSummary(id),
  ]);
  if (!gateway) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Finance" title={gateway.displayName} description="Edit gateway credentials and settlement settings" />
      <GatewayDetailClient gateway={gateway} settlement={settlement} />
    </div>
  );
}
