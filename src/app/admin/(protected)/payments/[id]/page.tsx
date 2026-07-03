import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getPaymentAuditLogs, getPaymentDetail } from "@/lib/admin/payments";
import PaymentDetailClient from "./PaymentDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const payment = await getPaymentDetail(id);
  return { title: payment ? `Payment ${payment.paymentRef ?? id.slice(0, 8)}` : "Payment" };
}

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.PAYMENTS_MANAGE);
  const { id } = await params;

  const [payment, audit] = await Promise.all([getPaymentDetail(id), getPaymentAuditLogs(id)]);
  if (!payment) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Finance"
        title={`Payment ${payment.paymentRef ?? payment.id.slice(0, 8)}`}
        description={`Order ${payment.orderNumber} · ${payment.customerName}`}
      />
      <PaymentDetailClient payment={payment} audit={audit} />
    </div>
  );
}
