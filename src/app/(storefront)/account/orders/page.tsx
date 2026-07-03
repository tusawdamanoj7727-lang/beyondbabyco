import Link from "next/link";
import { Truck } from "lucide-react";

import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import CourierBadge from "@/components/shipping/CourierBadge";
import { getCustomerOrdersWithShipments } from "@/lib/orders/customer-shipment";
import { focusRing, interactiveSurface } from "@/lib/design/ui";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";

export const metadata = buildPageMetadata({
  title: "My Orders",
  path: "/account/orders",
  noIndex: true,
});

function formatMoney(n: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(n);
}

export default async function AccountOrdersPage() {
  const orders = await getCustomerOrdersWithShipments();

  return (
    <div className="space-y-8" id="track">
      <div>
        <h1 className="font-heading text-2xl font-bold text-green-900">My Orders</h1>
        <p className="mt-1 text-sm text-green-700/70">Track shipments, download invoices, and manage returns.</p>
      </div>

      {orders.length === 0 ? (
        <CatalogEmptyState
          title="No orders yet"
          description="When you place your first order, tracking and invoices will show up here."
          actionLabel="Explore products"
          actionHref="/products"
          secondaryLabel="Learn about our care"
          secondaryHref="/#science"
          mascot="bella-bunny"
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className={cn(
                  interactiveSurface,
                  "block rounded-3xl border border-green-100 bg-white/90 p-5 shadow-sm",
                  focusRing,
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-lg font-bold text-green-900">{order.orderNumber}</p>
                    <p className="mt-1 text-sm text-green-700/70">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")} · {order.itemCount} items
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <OrderStatusBadge status={order.status as never} size="sm" />
                    <span className="font-semibold text-green-900">
                      {formatMoney(order.grandTotal, order.currency)}
                    </span>
                  </div>
                </div>

                {(order.trackingNumber || order.expectedDelivery) && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-green-50/80 px-4 py-3 text-sm">
                    <Truck className="h-4 w-4 text-green-600" aria-hidden="true" />
                    {order.carrier ? <CourierBadge name={order.carrier} /> : null}
                    {order.trackingNumber ? (
                      <span className="font-mono text-green-800">AWB {order.trackingNumber}</span>
                    ) : null}
                    {order.expectedDelivery ? (
                      <span className="text-green-700/80">
                        Est. delivery {new Date(order.expectedDelivery).toLocaleDateString("en-IN")}
                      </span>
                    ) : null}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
