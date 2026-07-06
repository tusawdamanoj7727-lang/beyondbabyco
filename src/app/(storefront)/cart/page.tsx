import CartPageClient from "@/components/cart/CartPageClient";
import StorefrontErrorBoundary from "@/components/ui/StorefrontErrorBoundary";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Cart",
  path: "/cart",
  noIndex: true,
});

export default function CartPage() {
  return (
    <div className="min-h-screen bg-[#faf5f0]/40">
      <StorefrontErrorBoundary context="cart">
        <CartPageClient />
      </StorefrontErrorBoundary>
    </div>
  );
}
