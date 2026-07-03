"use client";

import Link from "next/link";
import MotionSection from "@/components/ui/MotionSection";
import Card from "@/components/ui/Card";
import StatsCard from "@/components/admin/StatsCard";
import { formatMoney, type FinanceDashboard, type FinancialReportSection } from "@/lib/admin/finance-types";

export default function FinanceDashboardClient({
  dashboard,
  reports,
}: {
  dashboard: FinanceDashboard;
  reports: FinancialReportSection[];
}) {
  return (
    <div className="space-y-8">
      <MotionSection as="div" variant="fadeUp" viewport={false}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <StatsCard label="Today's Revenue" value={formatMoney(dashboard.todaysRevenue)} icon="payments" />
          <StatsCard label="Today's Expenses" value={formatMoney(dashboard.todaysExpenses)} icon="expenses" />
          <StatsCard label="Net Profit" value={formatMoney(dashboard.netProfit)} icon="accounting" />
          <StatsCard label="Outstanding Vendor Payments" value={formatMoney(dashboard.outstandingVendorPayments)} icon="giftcards" />
          <StatsCard label="GST Payable" value={formatMoney(dashboard.gstPayable)} icon="gst" />
          <StatsCard label="GST Collected" value={formatMoney(dashboard.gstCollected)} icon="gst" />
          <StatsCard label="Refund Amount" value={formatMoney(dashboard.refundAmount)} icon="activity" />
          <StatsCard label="Bank Balance" value={formatMoney(dashboard.bankBalance)} icon="accounting" />
          <StatsCard label="Pending Reconciliation" value={String(dashboard.pendingReconciliation)} icon="reports" />
        </div>
      </MotionSection>

      <div className="flex flex-wrap gap-2">
        <QuickLink href="/admin/finance/expenses" label="Manage Expenses" />
        <QuickLink href="/admin/finance/vendors" label="Vendors" />
        <QuickLink href="/admin/finance/ledger" label="Ledger" />
        <QuickLink href="/admin/finance/gst" label="GST Reports" />
        <QuickLink href="/admin/finance/reconciliation" label="Bank Reconciliation" />
      </div>

      <section aria-labelledby="financial-reports-heading">
        <h2 id="financial-reports-heading" className="font-heading text-lg font-bold text-green-900">Financial Reports</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {reports.map((r) => (
            <Card key={r.id} padding="md" radius="3xl" variant="outline">
              <h3 className="font-heading text-sm font-bold text-green-900">{r.title}</h3>
              <dl className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
                {r.metrics.map((m) => (
                  <div key={m.label}>
                    <dt className="text-green-700/60">{m.label}</dt>
                    <dd className="font-semibold text-green-900">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      </section>

      <Card padding="md" radius="3xl" variant="outline" className="border-dashed">
        <h3 className="font-heading text-sm font-bold text-green-900">Future integrations</h3>
        <p className="mt-1 text-sm text-green-700/60">Architecture is ready for Tally, Zoho Books, QuickBooks and Xero — no external sync connected yet.</p>
        <ul className="mt-2 list-inside list-disc text-xs text-green-700/70">
          <li>Tally export</li>
          <li>Zoho Books sync</li>
          <li>QuickBooks sync</li>
          <li>Xero sync</li>
        </ul>
      </Card>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex h-10 items-center rounded-3xl border border-green-200 px-4 text-sm font-medium text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
      {label}
    </Link>
  );
}
