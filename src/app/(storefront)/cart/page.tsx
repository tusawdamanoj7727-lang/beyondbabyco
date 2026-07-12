import CartPageClient from "@/components/cart/CartPageClient";
import StorefrontErrorBoundary from "@/components/ui/StorefrontErrorBoundary";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Cart",
  path: "/cart",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default function CartPage() {
  return (
    <StorefrontErrorBoundary context="cart">
      <CartPageClient />
    </StorefrontErrorBoundary>
  );
}
