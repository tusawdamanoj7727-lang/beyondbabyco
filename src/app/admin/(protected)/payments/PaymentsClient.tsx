"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import PaymentStatusBadge from "@/components/admin/PaymentStatusBadge";
import StatsCard from "@/components/admin/StatsCard";
import { Select, fieldControlClasses } from "@/components/admin/FormField";
import MotionSection from "@/components/ui/MotionSection";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  PAYMENT_STATUSES,
  formatMoney,
  type PaymentDashboard,
  type PaymentListItem,
} from "@/lib/admin/payment-types";
import type { PaymentStatus } from "@/lib/supabase/database.types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PaymentsClient(props: {
  rows: PaymentListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  dashboard: PaymentDashboard;
  gateways: { id: string; display_name: string; provider: string }[];
  customers: { id: string; name: string }[];
  filters: {
    search: string;
    status: PaymentStatus | "all";
    gatewayId: string;
    method: string;
    customerId: string;
    dateFrom: string;
    dateTo: string;
  };
}) {
  const router = useRouter();
  const [search, setSearch] = useState(props.filters.search);
  const [, startTransition] = useTransition();

  useEffect(() => setSearch(props.filters.search), [props.filters.search]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== props.filters.search) push({ q: search });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function push(patch: Record<string, string | null>, resetPage = true) {
    const sp = new URLSearchParams();
    const base: Record<string, string> = {
      q: props.filters.search,
      status: props.filters.status,
      gateway: props.filters.gatewayId,
      method: props.filters.method,
      customer: props.filters.customerId,
      from: props.filters.dateFrom,
      to: props.filters.dateTo,
      page: String(props.page),
    };
    const merged = { ...base, ...patch };
    if (resetPage && !("page" in patch)) merged.page = "1";
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") sp.set(k, v);
    }
    startTransition(() => router.push(`/admin/payments?${sp.toString()}`));
  }

  const columns: Column<PaymentListItem>[] = [
    {
      key: "id",
      header: "Payment ID",
      render: (r) => (
        <Link href={`/admin/payments/${r.id}`} className="font-semibold text-green-800 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 rounded">
          {r.paymentRef ?? r.id.slice(0, 8)}
        </Link>
      ),
    },
    {
      key: "order",
      header: "Order",
      render: (r) => (
        <Link href={`/admin/orders/${r.orderId}`} className="text-green-800 hover:underline">{r.orderNumber}</Link>
      ),
    },
    { key: "customer", header: "Customer", render: (r) => r.customerName },
    { key: "gateway", header: "Gateway", render: (r) => r.gatewayName ?? "—" },
    { key: "amount", header: "Amount", render: (r) => formatMoney(r.amount, r.currency) },
    { key: "method", header: "Method", render: (r) => r.method ?? "—" },
    { key: "status", header: "Status", render: (r) => <PaymentStatusBadge status={r.status} /> },
    { key: "txn", header: "Transaction ID", render: (r) => r.gatewayTxnId ?? "—" },
    { key: "created", header: "Created", render: (r) => formatDate(r.createdAt) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Link href={`/admin/payments/${r.id}`} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <MotionSection as="div" variant="fadeUp" viewport={false}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatsCard label="Today's Revenue" value={formatMoney(props.dashboard.todaysRevenue)} icon="payments" />
          <StatsCard label="Captured Payments" value={String(props.dashboard.capturedPayments)} icon="activity" />
          <StatsCard label="Pending Payments" value={String(props.dashboard.pendingPayments)} icon="orders" />
          <StatsCard label="Failed Payments" value={String(props.dashboard.failedPayments)} icon="reports" />
          <StatsCard label="Refund Amount" value={formatMoney(props.dashboard.refundAmount)} icon="giftcards" />
          <StatsCard label="Settlement Difference" value={formatMoney(props.dashboard.settlementDifference)} icon="accounting" />
        </div>
      </MotionSection>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center" role="search" aria-label="Payment filters">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search payment, order, txn…"
          aria-label="Search payments"
          className={fieldControlClasses + " flex-1 min-w-[200px]"}
        />
        <Select aria-label="Gateway filter" value={props.filters.gatewayId || "all"} onChange={(e) => push({ gateway: e.target.value === "all" ? null : e.target.value })} className="lg:w-44">
          <option value="all">All gateways</option>
          {props.gateways.map((g) => (
            <option key={g.id} value={g.id}>{g.display_name}</option>
          ))}
        </Select>
        <Select aria-label="Status filter" value={props.filters.status} onChange={(e) => push({ status: e.target.value })} className="lg:w-40">
          <option value="all">All statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </Select>
        <Select aria-label="Method filter" value={props.filters.method || "all"} onChange={(e) => push({ method: e.target.value === "all" ? null : e.target.value })} className="lg:w-36">
          <option value="all">All methods</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
          <option value="netbanking">Net Banking</option>
          <option value="wallet">Wallet</option>
          <option value="cod">COD</option>
        </Select>
        <Select aria-label="Customer filter" value={props.filters.customerId || "all"} onChange={(e) => push({ customer: e.target.value === "all" ? null : e.target.value })} className="lg:w-44">
          <option value="all">All customers</option>
          {props.customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <input type="date" aria-label="Date from" value={props.filters.dateFrom} onChange={(e) => push({ from: e.target.value || null })} className={fieldControlClasses + " lg:w-36"} />
        <input type="date" aria-label="Date to" value={props.filters.dateTo} onChange={(e) => push({ to: e.target.value || null })} className={fieldControlClasses + " lg:w-36"} />
      </div>

      <DataTable columns={columns} rows={props.rows} getRowId={(r) => r.id} empty="No payments found." />

      <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) }, false)} />

      {props.rows.some((r) => r.status === "failed") && (
        <Card padding="md" radius="3xl" variant="outline" aria-labelledby="recon-heading">
          <h2 id="recon-heading" className="font-heading text-sm font-bold text-green-900">Reconciliation alerts</h2>
          <p className="mt-1 text-sm text-green-700/70">Failed or mismatched payments are highlighted on detail pages. Run settlement sync from gateway settings.</p>
          <ul className="mt-3 space-y-1 text-sm">
            {props.rows.filter((r) => r.status === "failed").slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <Badge variant="warning" size="sm">Mismatch</Badge>
                <Link href={`/admin/payments/${r.id}`} className="text-green-800 hover:underline">{r.paymentRef ?? r.id.slice(0, 8)}</Link>
                <span className="text-green-700/60">· {r.orderNumber}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
