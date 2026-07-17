import CartPageClient from "@/components/cart/CartPageClient";
import StorefrontErrorBoundary from "@/components/ui/StorefrontErrorBoundary";
import { listSevenStorefrontProducts } from "@/lib/catalog/storefront";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Cart",
  path: "/cart",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function CartPage() {
  let upsellProducts: Awaited<ReturnType<typeof listSevenStorefrontProducts>> = [];
  try {
    upsellProducts = await listSevenStorefrontProducts();
  } catch {
    upsellProducts = [];
  }

  return (
    <StorefrontErrorBoundary context="cart">
      <CartPageClient upsellProducts={upsellProducts} />
    </StorefrontErrorBoundary>
  );
}
