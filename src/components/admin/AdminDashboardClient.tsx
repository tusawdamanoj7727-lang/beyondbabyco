"use client";

import Link from "next/link";

import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import StatsCard from "@/components/admin/StatsCard";
import EmptyState from "@/components/admin/EmptyState";
import Icon, { type IconName } from "@/components/admin/Icon";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import Badge from "@/components/ui/Badge";
import { formatInr } from "@/lib/catalog/format";
import type { AdminDashboardOverview } from "@/lib/admin/dashboard-overview";
import type { OrderStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS: { label: string; icon: IconName; href: string }[] = [
  { label: "Orders", icon: "orders", href: "/admin/orders" },
  { label: "Shipments", icon: "orders", href: "/admin/shipping" },
  { label: "Returns", icon: "audit", href: "/admin/returns" },
  { label: "Inventory", icon: "inventory", href: "/admin/inventory" },
  { label: "Customers", icon: "customers", href: "/admin/customers" },
  { label: "Reports", icon: "reports", href: "/admin/reports" },
  { label: "Exports", icon: "reports", href: "/admin/exports" },
  { label: "Ops queues", icon: "settings", href: "/admin/operations/queues" },
];

export default function AdminDashboardClient({ data }: { data: AdminDashboardOverview }) {
  const healthColor =
    data.storeHealth.overall === "healthy"
      ? "success"
      : data.storeHealth.overall === "degraded"
        ? "warning"
        : "default";

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600">Operations</p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-green-900">Dashboard</h1>
          <p className="mt-1 text-sm text-green-700/70">
            Revenue, fulfillment, inventory, and store health at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-3xl border border-cream-300 bg-white px-4 text-sm font-semibold text-green-800 transition-colors hover:bg-cream-50"
          >
            <Icon name="external" size={16} />
            Preview store
          </a>
          <Link
            href="/admin/orders"
            className="inline-flex h-10 items-center gap-2 rounded-3xl bg-green-600 px-4 text-sm font-semibold text-cream-50 transition-colors hover:bg-green-700"
          >
            <Icon name="orders" size={16} />
            Manage orders
          </Link>
        </div>
      </header>

      <section aria-label="Revenue overview">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Reveal as="div" viewport={false} delay={0}>
            <StatsCard label="Revenue (month)" value={data.stats.revenueMonth} icon="revenue" hint="Excl. cancelled/refunded" glass />
          </Reveal>
          <Reveal as="div" viewport={false} delay={0.04}>
            <StatsCard label="AOV (month)" value={data.stats.aovMonth} icon="revenue" hint="Average order value" glass />
          </Reveal>
          <Reveal as="div" viewport={false} delay={0.08}>
            <StatsCard
              label="Orders today"
              value={String(data.stats.ordersToday)}
              icon="orders"
              hint={`${data.stats.ordersWeek} this week · ${data.stats.ordersMonth} this month`}
              glass
            />
          </Reveal>
          <Reveal as="div" viewport={false} delay={0.12}>
            <StatsCard
              label="Pending refunds"
              value={String(data.stats.refundsPending)}
              icon="payments"
              hint={`${data.stats.refundsMonthAmount} refund volume (month)`}
              glass
            />
          </Reveal>
        </div>
      </section>

      <section aria-label="Fulfillment snapshot">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatsCard label="Pending" value={String(data.stats.pendingOrders)} icon="activity" hint="Awaiting confirm" />
          <StatsCard label="Processing" value={String(data.stats.processingOrders)} icon="inventory" hint="Packed / processing" />
          <StatsCard label="Delivered" value={String(data.stats.deliveredOrders)} icon="orders" hint="All time" />
          <StatsCard label="Cancelled" value={String(data.stats.cancelledOrders)} icon="close" hint="Incl. refunded" />
          <StatsCard label="Low stock" value={String(data.stats.lowStock)} icon="inventory" hint="At/below reorder" />
          <StatsCard label="Out of stock" value={String(data.stats.outOfStock)} icon="inventory" hint="Available ≤ 0" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section aria-label="Recent orders" className="xl:col-span-2">
          <Card variant="glass" padding="lg" radius="3xl" fullHeight className="border border-white/80 shadow-clay">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon name="orders" size={18} />
                <h2 className="font-heading text-base font-bold text-green-900">Recent activity</h2>
              </div>
              <Link href="/admin/orders" className="text-sm font-semibold text-terra-600 hover:underline">
                View all
              </Link>
            </div>
            {data.recentOrders.length === 0 ? (
              <EmptyState icon="orders" title="No orders yet" description="Orders will appear here as customers checkout." />
            ) : (
              <ul className="divide-y divide-cream-200">
                {data.recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-cream-50/80"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-green-900">{order.orderNumber}</p>
                        <p className="truncate text-xs text-green-700/65">{order.customerName ?? "Guest"}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <OrderStatusBadge status={order.status as OrderStatus} />
                        <span className="text-sm font-bold text-green-900">{formatInr(order.grandTotal)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section aria-label="Store health">
          <Card variant="glass" padding="lg" radius="3xl" fullHeight className="border border-white/80 shadow-clay">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="settings" size={18} />
              <h2 className="font-heading text-base font-bold text-green-900">Store health</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-cream-200 bg-white/80 px-4 py-3">
                <span className="text-sm font-medium text-green-800">Overall</span>
                <Badge variant={healthColor} size="sm">
                  {data.storeHealth.overall}
                </Badge>
              </div>
              <HealthRow label="Database" ok={data.storeHealth.dbOk} />
              <HealthRow label="Email provider" ok={data.storeHealth.emailOk} />
              <HealthRow label="Homepage" ok={data.homepagePublished} okLabel="Published" failLabel="Draft" />
              {data.stats.lowStock > 0 || data.stats.outOfStock > 0 ? (
                <Link
                  href="/admin/inventory"
                  className="block rounded-2xl border border-terra-200 bg-terra-50 px-4 py-3 text-sm font-medium text-terra-800 hover:bg-terra-100/80"
                >
                  {data.stats.outOfStock > 0
                    ? `${data.stats.outOfStock} out of stock`
                    : `${data.stats.lowStock} low stock`}
                  {data.stats.lowStock > 0 && data.stats.outOfStock > 0
                    ? ` · ${data.stats.lowStock} low`
                    : ""}
                </Link>
              ) : null}
              {data.storeHealth.envWarnings > 0 ? (
                <Link
                  href="/admin/operations"
                  className="block rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-sm text-green-800"
                >
                  {data.storeHealth.envWarnings} environment warning
                  {data.storeHealth.envWarnings === 1 ? "" : "s"}
                </Link>
              ) : null}
              <Link
                href="/admin/operations/queues"
                className="block rounded-2xl border border-green-100 bg-green-50/70 px-4 py-3 text-sm font-medium text-green-800 hover:bg-green-50"
              >
                Open queues & cron status →
              </Link>
            </div>
          </Card>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-label="Top products">
          <Card variant="glass" padding="lg" radius="3xl" className="border border-white/80 shadow-clay">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="products" size={18} />
              <h2 className="font-heading text-base font-bold text-green-900">Top products</h2>
            </div>
            {data.topProducts.length === 0 ? (
              <EmptyState icon="products" title="No sales data" description="Top sellers appear after your first orders." />
            ) : (
              <ol className="space-y-2">
                {data.topProducts.map((p, i) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="flex items-center justify-between rounded-2xl px-3 py-2.5 transition-colors hover:bg-cream-50"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green-100 text-xs font-bold text-green-800">
                          {i + 1}
                        </span>
                        <span className="truncate font-medium text-green-900">{p.name}</span>
                      </span>
                      <span className="text-xs font-semibold text-green-700/70">{p.orderCount} sold</span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </section>

        <section aria-label="Quick actions">
          <Card variant="glass" padding="lg" radius="3xl" className="border border-white/80 shadow-clay">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="sparkles" size={18} />
              <h2 className="font-heading text-base font-bold text-green-900">Quick actions</h2>
            </div>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {QUICK_ACTIONS.map((action) => (
                <li key={action.label}>
                  <Link
                    href={action.href}
                    className="flex h-full items-center gap-3 rounded-2xl border border-cream-200 bg-white/85 px-3.5 py-3 text-sm font-medium text-green-800 transition-all duration-[var(--duration-button)] hover:border-green-200 hover:bg-green-50/80 hover:shadow-sm"
                  >
                    <span className="text-green-600">
                      <Icon name={action.icon} size={18} />
                    </span>
                    {action.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <section aria-label="Catalog snapshot" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard label="Active products" value={String(data.stats.products)} icon="products" glass />
        <StatsCard label="Total orders" value={String(data.stats.orders)} icon="orders" glass />
        <StatsCard label="Customers" value={String(data.stats.customers)} icon="customers" glass />
      </section>
    </div>
  );
}

function HealthRow({
  label,
  ok,
  okLabel = "OK",
  failLabel = "Check",
}: {
  label: string;
  ok: boolean;
  okLabel?: string;
  failLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-cream-200 bg-white/80 px-4 py-3">
      <span className="text-sm font-medium text-green-800">{label}</span>
      <span className={cn("text-xs font-semibold", ok ? "text-green-700" : "text-terra-600")}>
        {ok ? okLabel : failLabel}
      </span>
    </div>
  );
}
