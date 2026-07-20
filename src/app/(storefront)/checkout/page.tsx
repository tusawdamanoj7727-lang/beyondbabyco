import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import CheckoutRoute from "@/components/checkout/CheckoutRoute";
import { getCheckoutInitialDataAction } from "@/lib/checkout/actions";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Checkout",
  path: "/checkout",
  noIndex: true,
});

export default async function CheckoutPage() {
  // Guest + authenticated checkout — never redirect to login solely for access.
  const initial = await getCheckoutInitialDataAction();

  return (
    <>
      <CatalogBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout" },
        ]}
      />
      <div className="container pb-16 pt-1">
        <header className="mb-6 sm:mb-8">
          <h1 className="font-heading text-3xl font-bold text-green-900 sm:text-4xl">Checkout</h1>
          <p className="mt-2 max-w-2xl text-sm text-green-700 sm:text-base">
            {initial.isGuest
              ? "Checkout as a guest — no account required. Create one after your order if you like."
              : "Secure, research-backed care — delivered to your door."}
          </p>
        </header>
        <CheckoutRoute initial={initial} />
      </div>
    </>
  );
}
