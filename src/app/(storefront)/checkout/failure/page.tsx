import Link from "next/link";

import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import Button from "@/components/ui/Button";
import { Mascot } from "@/components/mascots";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Payment Issue",
  path: "/checkout/failure",
  noIndex: true,
});

export default async function CheckoutFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; reason?: string }>;
}) {
  const { orderId, reason } = await searchParams;

  const messages: Record<string, string> = {
    cancelled: "You cancelled the payment. Your cart is saved — you can try again when ready.",
    verify: "We couldn't verify your payment. If amount was deducted, contact support with your order ID.",
    failed: "Payment failed. Please try again or choose another payment method.",
    timeout: "Payment timed out. Please retry checkout.",
  };

  const message = messages[reason ?? "failed"] ?? messages.failed;

  return (
    <>
      <CatalogBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Checkout" },
        ]}
      />
      <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center px-4 pb-16 text-center">
        <Mascot mascot="poppy-panda" pose="peek" size={140} animated floating alt="" />
        <h1 className="mt-6 font-heading text-3xl font-bold text-green-900">Payment not completed</h1>
        <p className="mt-3 text-green-700">{message}</p>
        {orderId ? (
          <p className="mt-2 text-sm text-green-600/80">Order reference: {orderId.slice(0, 8)}…</p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="primary">
            <Link href="/checkout">Retry Checkout</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/cart">Back to Cart</Link>
          </Button>
          {orderId ? (
            <Button asChild variant="secondary">
              <Link href={`/account/orders/${orderId}`}>View Order</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}
