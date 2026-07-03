import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  getPaymentDashboard,
  getPaymentFilterOptions,
  listPayments,
} from "@/lib/admin/payments";
import { PAYMENT_STATUSES } from "@/lib/admin/payment-types";
import type { PaymentStatus } from "@/lib/supabase/database.types";
import PaymentsClient from "./PaymentsClient";

export const metadata: Metadata = { title: "Payments" };

const STATUSES = ["all", ...PAYMENT_STATUSES] as const;

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.PAYMENTS_MANAGE);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as PaymentStatus | "all") : "all";

  const [result, dashboard, options] = await Promise.all([
    listPayments({
      search: sp.q ?? "",
      status,
      gatewayId: sp.gateway,
      method: sp.method,
      customerId: sp.customer,
      dateFrom: sp.from,
      dateTo: sp.to,
      page,
    }),
    getPaymentDashboard(),
    getPaymentFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        description="Monitor transactions, settlements, webhooks and reconciliation"
        actions={
          <Link
            href="/admin/payment-gateways"
            className="inline-flex h-12 items-center gap-2 rounded-3xl border border-green-200 px-6 font-medium text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500 focus-visible:ring-offset-2"
          >
            <Icon name="accounting" size={18} />
            Payment Gateways
          </Link>
        }
      />
      <PaymentsClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        dashboard={dashboard}
        gateways={options.gateways}
        customers={options.customers}
        filters={{
          search: sp.q ?? "",
          status,
          gatewayId: sp.gateway ?? "",
          method: sp.method ?? "",
          customerId: sp.customer ?? "",
          dateFrom: sp.from ?? "",
          dateTo: sp.to ?? "",
        }}
      />
    </div>
  );
}
