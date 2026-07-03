import CartClient from "@/components/catalog/CartClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Cart",
  path: "/cart",
  noIndex: true,
});

export default function CartPage() {
  return <CartClient />;
}
