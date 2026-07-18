import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import TrackOrderClient from "@/components/orders/TrackOrderClient";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ORDER_NUMBER_REGEX } from "@/lib/orders/guest-track-types";

export const metadata = buildPageMetadata({
  title: "Track Order",
  description: "Track your BeyondBabyCo order with your order number and checkout email. No account required.",
  path: "/track-order",
});

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const initial =
    order && ORDER_NUMBER_REGEX.test(order.trim().toUpperCase().replace(/\s+/g, ""))
      ? order.trim().toUpperCase().replace(/\s+/g, "")
      : "";

  return (
    <>
      <CatalogBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Track Order" },
        ]}
      />
      <TrackOrderClient initialOrderNumber={initial} />
    </>
  );
}
