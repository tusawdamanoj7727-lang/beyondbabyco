"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import StatsCard from "@/components/admin/StatsCard";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import {
  CHART_LABELS,
  DASHBOARD_WIDGET_LABELS,
  type ChartKey,
  type DashboardWidgetKey,
  type ExecutiveDashboard,
} from "@/lib/admin/report-types";
import { saveDashboardLayout } from "@/lib/admin/report-actions";
import ReportChart from "./ReportChart";

const WIDGET_ICONS: Partial<Record<DashboardWidgetKey, "payments" | "orders" | "customers" | "inventory" | "reports" | "activity" | "coupons" | "reviews" | "giftcards" | "accounting">> = {
  todays_revenue: "payments",
  monthly_revenue: "payments",
  orders_today: "orders",
  average_order_value: "payments",
  new_customers: "customers",
  returning_customers: "customers",
  inventory_value: "inventory",
  low_stock: "inventory",
  pending_orders: "orders",
  returns: "activity",
  refunds: "giftcards",
  pending_reviews: "reviews",
  active_coupons: "coupons",
  top_carrier: "orders",
  payment_success_rate: "accounting",
};

export default function DashboardWidgetGrid({
  dashboard,
  canManage,
}: {
  dashboard: ExecutiveDashboard;
  canManage: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [layout, setLayout] = useState(dashboard.widgetLayout);
  const [dragKey, setDragKey] = useState<DashboardWidgetKey | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleVisible(key: DashboardWidgetKey) {
    setLayout((prev) => prev.map((w) => (w.widgetKey === key ? { ...w, visible: !w.visible } : w)));
  }

  function onDrop(targetKey: DashboardWidgetKey) {
    if (!dragKey || dragKey === targetKey) return;
    setLayout((prev) => {
      const from = prev.find((w) => w.widgetKey === dragKey)!;
      const to = prev.find((w) => w.widgetKey === targetKey)!;
      return prev
        .map((w) => {
          if (w.widgetKey === dragKey) return { ...w, sortOrder: to.sortOrder };
          if (w.widgetKey === targetKey) return { ...w, sortOrder: from.sortOrder };
          return w;
        })
        .sort((a, b) => a.sortOrder - b.sortOrder);
    });
    setDragKey(null);
  }

  function saveLayout() {
    startTransition(async () => {
      const res = await saveDashboardLayout({ widgets: layout });
      notifyActionResult(toast, res);
      router.refresh();
    });
  }

  const visibleWidgets = [...layout].filter((w) => w.visible).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-green-200 bg-green-50 px-4 py-3">
          <span className="text-sm font-medium text-green-800">Customize dashboard</span>
          <div className="flex flex-wrap gap-1">
            {layout.map((w) => (
              <button
                key={w.widgetKey}
                type="button"
                onClick={() => toggleVisible(w.widgetKey)}
                className={`rounded-full px-2 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 ${w.visible ? "bg-green-500 text-white" : "bg-white text-green-700"}`}
                aria-pressed={w.visible}
              >
                {DASHBOARD_WIDGET_LABELS[w.widgetKey]}
              </button>
            ))}
          </div>
          <Button size="sm" className="ml-auto" disabled={pending} onClick={saveLayout}>Save layout</Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {visibleWidgets.map((w) => (
          <div
            key={w.widgetKey}
            draggable={canManage}
            onDragStart={() => setDragKey(w.widgetKey)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(w.widgetKey)}
            className={canManage ? "cursor-grab active:cursor-grabbing" : undefined}
          >
            <StatsCard
              label={DASHBOARD_WIDGET_LABELS[w.widgetKey]}
              value={dashboard.widgets[w.widgetKey]}
              icon={WIDGET_ICONS[w.widgetKey] ?? "reports"}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {(Object.keys(dashboard.charts) as ChartKey[]).slice(0, 6).map((key) => (
          <div key={key} className="rounded-3xl border border-cream-200 bg-white p-5">
            <h3 className="font-heading text-sm font-bold text-green-900">{CHART_LABELS[key]}</h3>
            <div className="mt-4">
              <ReportChart
                data={dashboard.charts[key]}
                type={key.includes("trend") || key.includes("growth") || key.includes("movement") ? "line" : key.includes("split") || key.includes("distribution") ? "donut" : "bar"}
                ariaLabel={CHART_LABELS[key]}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {(Object.keys(dashboard.charts) as ChartKey[]).slice(6).map((key) => (
          <div key={key} className="rounded-3xl border border-cream-200 bg-white p-5">
            <h3 className="font-heading text-sm font-bold text-green-900">{CHART_LABELS[key]}</h3>
            <div className="mt-4">
              <ReportChart data={dashboard.charts[key]} type="bar" ariaLabel={CHART_LABELS[key]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
