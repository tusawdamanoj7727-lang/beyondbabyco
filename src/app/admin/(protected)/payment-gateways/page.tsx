import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listPaymentGateways } from "@/lib/admin/payments";
import PaymentGatewaysClient from "./PaymentGatewaysClient";

export const metadata: Metadata = { title: "Payment Gateways" };

export default async function PaymentGatewaysPage() {
  await requirePermission(PERMISSIONS.PAYMENTS_MANAGE);
  const gateways = await listPaymentGateways();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Finance"
        title="Payment Gateways"
        description="Configure Razorpay, Cashfree, PhonePe, PayU, Stripe and PayPal adapters"
        actions={
          <Link
            href="/admin/payment-gateways/new"
            className="inline-flex h-12 items-center gap-2 rounded-3xl bg-green-500 px-6 font-medium text-cream-50 shadow-clay transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500 focus-visible:ring-offset-2"
          >
            <Icon name="plus" size={18} />
            Add Gateway
          </Link>
        }
      />
      <PaymentGatewaysClient gateways={gateways} />
    </div>
  );
}
