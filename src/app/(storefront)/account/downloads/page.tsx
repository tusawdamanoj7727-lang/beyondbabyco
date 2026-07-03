import Link from "next/link";
import { Download, FileText } from "lucide-react";

import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { getCustomerOrdersWithShipments } from "@/lib/orders/customer-shipment";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Downloads",
  path: "/account/downloads",
  noIndex: true,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AccountDownloadsPage() {
  const orders = await getCustomerOrdersWithShipments();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-green-900">Downloads</h1>
        <p className="mt-1 text-sm text-green-700/70">Invoices and shipping labels for your orders.</p>
      </div>

      {orders.length === 0 ? (
        <CatalogEmptyState
          title="No downloads yet"
          description="Invoices and shipping documents appear here after your first order."
          actionLabel="Start shopping"
          actionHref="/products"
          secondaryLabel="View orders"
          secondaryHref="/account/orders"
          mascot="bella-bunny"
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-green-100 bg-white/90 p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-green-900">{order.orderNumber}</p>
                  <p className="text-xs text-green-700/70">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/account/orders/${order.id}/documents/invoice`}
                  target="_blank"
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-green-200 px-4 text-sm font-semibold text-green-800 transition hover:bg-green-50"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Invoice
                </Link>
                {order.trackingNumber ? (
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-green-600 px-4 text-sm font-semibold text-cream-50 transition hover:bg-green-700"
                  >
                    View shipment
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
