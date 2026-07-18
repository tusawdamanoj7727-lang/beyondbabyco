import { getCurrentUser } from "@/lib/auth/session";
import { getWishlistProducts } from "@/lib/storefront/wishlist-actions";
import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import WishlistClient from "@/components/catalog/WishlistClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Wishlist",
  path: "/wishlist",
  noIndex: true,
});

export default async function WishlistPage() {
  const user = await getCurrentUser();
  let products: Awaited<ReturnType<typeof getWishlistProducts>> = [];
  try {
    products = user ? await getWishlistProducts() : [];
  } catch {
    products = [];
  }

  return (
    <>
      <CatalogBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Wishlist" },
        ]}
      />
      <div className="container pb-16">
        <h1 className="mb-8 font-heading text-3xl font-bold text-green-900">Wishlist</h1>
        <WishlistClient products={products} isLoggedIn={!!user} />
      </div>
    </>
  );
}
