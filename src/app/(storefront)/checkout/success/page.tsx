import Link from "next/link";
import { redirect } from "next/navigation";

import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import Button from "@/components/ui/Button";
import OrderSuccessNotifier from "@/components/account/OrderSuccessNotifier";
import { Mascot } from "@/components/mascots";
import { formatInr } from "@/lib/catalog/format";
import { getOrderSuccessDataAction } from "@/lib/checkout/actions";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Order Confirmed",
  path: "/checkout/success",
  noIndex: true,
});

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  if (!orderId) redirect("/account/orders");

  const order = await getOrderSuccessDataAction(orderId);
  if (!order) redirect("/account/orders");

  return (
    <>
      <OrderSuccessNotifier orderNumber={order.orderNumber} orderId={orderId} />
      <CatalogBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Order Confirmed" },
        ]}
      />
      <div className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center px-4 pb-16 text-center">
        <Mascot mascot="bella-bunny" pose="celebration" size={160} animated floating alt="" />
        <h1 className="mt-6 font-heading text-3xl font-bold text-green-900">Thank you!</h1>
        <p className="mt-3 text-green-700/80">
          Your order is confirmed. We&apos;ve sent a confirmation email with your order details.
        </p>

        <div className="mt-8 w-full rounded-3xl border border-green-100 bg-white/90 p-6 text-left shadow-card">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-green-700">Order number</dt>
              <dd className="font-heading font-bold text-green-900">{order.orderNumber}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-green-700">Total paid</dt>
              <dd className="font-semibold text-green-900">{formatInr(order.grandTotal)}</dd>
            </div>
            {order.trackingNumber ? (
              <div className="flex justify-between gap-4">
                <dt className="text-green-700">Tracking number</dt>
                <dd className="font-mono text-sm font-semibold text-green-900">{order.trackingNumber}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-green-700">Estimated delivery</dt>
              <dd className="text-green-900">{order.estimatedDelivery ?? "3–5 business days"}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`/account/orders/${orderId}`}>
            <Button variant="primary" type="button">
              Track Order
            </Button>
          </Link>
          <Link href={`/account/orders/${orderId}/documents/invoice`} target="_blank">
            <Button variant="secondary" type="button">
              Download Invoice
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="secondary" type="button">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
