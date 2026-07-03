import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  getOrderDashboard,
  getOrderFilterOptions,
  listOrders,
  ORDER_SORTABLE_COLUMNS,
  type OrderSortColumn,
} from "@/lib/admin/orders";
import type { OrderStatus, PaymentStatus, ShipmentStatus } from "@/lib/supabase/database.types";
import { ORDER_STATUSES } from "@/lib/admin/order-types";
import OrdersClient from "./OrdersClient";

export const metadata: Metadata = { title: "Orders" };

function parseSort(v: string | undefined): OrderSortColumn {
  return (ORDER_SORTABLE_COLUMNS as readonly string[]).includes(v ?? "") ? (v as OrderSortColumn) : "created_at";
}

function parseOrderStatus(v: string | undefined): OrderStatus | "all" {
  return (ORDER_STATUSES as readonly string[]).includes(v ?? "") ? (v as OrderStatus) : "all";
}

const PAYMENT_STATUSES = ["all", "pending", "paid", "failed", "refunded", "partially_refunded"] as const;
const SHIPMENT_STATUSES = ["all", "pending", "label_created", "in_transit", "out_for_delivery", "delivered", "failed", "returned"] as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.ORDERS_MANAGE);

  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(sp.page) || 1);

  const [result, dashboard, options] = await Promise.all([
    listOrders({
      search: sp.q ?? "",
      status: parseOrderStatus(sp.status),
      payment: (PAYMENT_STATUSES as readonly string[]).includes(sp.payment ?? "") ? (sp.payment as PaymentStatus | "all") : "all",
      shipment: (SHIPMENT_STATUSES as readonly string[]).includes(sp.shipment ?? "") ? (sp.shipment as ShipmentStatus | "all") : "all",
      warehouseId: sp.warehouse,
      customerId: sp.customer,
      dateFrom: sp.from,
      dateTo: sp.to,
      sort,
      dir,
      page,
    }),
    getOrderDashboard(),
    getOrderFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="Manage orders, fulfillment, and customer purchases"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/shipments"
              className="inline-flex h-12 items-center gap-2 rounded-3xl border border-green-200 bg-cream-50 px-5 font-medium text-green-800 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500"
            >
              <Icon name="orders" size={18} />
              Shipments
            </Link>
            <Link
              href="/admin/orders/create"
              className="inline-flex h-12 items-center gap-2 rounded-3xl bg-green-500 px-6 font-medium text-cream-50 shadow-clay transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500 focus-visible:ring-offset-2"
            >
              <Icon name="plus" size={18} />
              Create Order
            </Link>
          </div>
        }
      />

      <OrdersClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        dashboard={dashboard}
        warehouses={options.warehouses}
        customers={options.customers}
        filters={{
          search: sp.q ?? "",
          status: parseOrderStatus(sp.status),
          payment: (PAYMENT_STATUSES as readonly string[]).includes(sp.payment ?? "") ? (sp.payment as PaymentStatus | "all") : "all",
          shipment: (SHIPMENT_STATUSES as readonly string[]).includes(sp.shipment ?? "") ? (sp.shipment as ShipmentStatus | "all") : "all",
          warehouseId: sp.warehouse ?? "",
          customerId: sp.customer ?? "",
          dateFrom: sp.from ?? "",
          dateTo: sp.to ?? "",
        }}
        sort={sort}
        dir={dir}
      />
    </div>
  );
}
