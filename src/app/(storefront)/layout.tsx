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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-green-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-terra-500"
      >
        Skip to main content
      </a>
      <main id="main-content" className="site-main-offset">
        {children}
      </main>
    </StorefrontProviders>
  );
}
