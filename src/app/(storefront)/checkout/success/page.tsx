import Link from "next/link";
import { redirect } from "next/navigation";

import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import Button from "@/components/ui/Button";
import OrderSuccessNotifier from "@/components/account/OrderSuccessNotifier";
import { Mascot } from "@/components/mascots";
import { formatInr } from "@/lib/catalog/format";
import { getOrderSuccessDataAction } from "@/lib/checkout/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { issueInvoiceToken } from "@/lib/invoices/token";

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
  if (!orderId) redirect("/products");

  const order = await getOrderSuccessDataAction(orderId);
  if (!order) redirect("/products");

  const user = await getCurrentUser();
  const isGuest = order.isGuest || (!user && order.isGuestCustomer);
  const registerHref = order.email
    ? `/register?email=${encodeURIComponent(order.email)}&redirectTo=${encodeURIComponent(`/account/orders/${orderId}`)}`
    : `/register?redirectTo=${encodeURIComponent(`/account/orders/${orderId}`)}`;

  const invoiceHref = isGuest
    ? `/api/invoices/${orderId}?token=${encodeURIComponent(issueInvoiceToken(orderId))}&download=1`
    : `/account/orders/${orderId}/documents/invoice?download=1`;

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
        <p className="mt-3 text-green-700">
          Your order is confirmed. We&apos;ve sent a confirmation email
          {order.email ? (
            <>
              {" "}
              to <span className="font-semibold text-green-900">{order.email}</span>
            </>
          ) : null}{" "}
          with your order details.
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

        {isGuest ? (
          <div className="mt-8 w-full rounded-3xl border border-terra-200 bg-terra-50/60 p-6 text-left">
            <h2 className="font-heading text-lg font-bold text-green-900">
              Create your BeyondBabyCo account
            </h2>
            <p className="mt-2 text-sm text-green-700">
              Save addresses, track orders, and see this purchase in your account. We&apos;ll link
              this guest order to your email automatically when you register.
            </p>
            <div className="mt-4">
              <Button asChild variant="primary" fullWidth>
                <Link href={registerHref}>Create your BeyondBabyCo account</Link>
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          {!isGuest ? (
            <Button asChild variant="primary">
              <Link href={`/account/orders/${orderId}`}>Track Order</Link>
            </Button>
          ) : null}
          <Button asChild variant={isGuest ? "primary" : "secondary"}>
            <Link href={invoiceHref}>
              Download Invoice
            </Link>
          </Button>
          {isGuest ? (
            <Button asChild variant="secondary">
              <Link href={registerHref}>Create account to track orders</Link>
            </Button>
          ) : null}
          <Button asChild variant="secondary">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
