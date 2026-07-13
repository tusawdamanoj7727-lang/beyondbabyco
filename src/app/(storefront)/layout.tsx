import StorefrontProviders from "@/components/layout/StorefrontProviders";
import { getWishlistProductIds } from "@/lib/storefront/wishlist-actions";

/**
 * Storefront-only chrome — cart, wishlist, and footer (navbar lives in root layout).
 */
export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const wishlistIds = await getWishlistProductIds();

  return (
    <StorefrontProviders wishlistIds={wishlistIds}>
      <a href="#main-content" className="a11y-skip-link">
        Skip to main content
      </a>
      <main id="main-content" className="site-main-offset">
        {children}
      </main>
    </StorefrontProviders>
  );
}
