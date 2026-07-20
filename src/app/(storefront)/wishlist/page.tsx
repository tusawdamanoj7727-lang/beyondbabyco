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

export const dynamic = "force-dynamic";

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
      <div className="container pb-10 md:pb-16">
        <h1 className="mb-5 font-heading text-2xl font-bold text-green-900 md:mb-8 md:text-3xl">
          Wishlist
        </h1>
        <WishlistClient products={products} isLoggedIn={!!user} />
      </div>
    </>
  );
}
