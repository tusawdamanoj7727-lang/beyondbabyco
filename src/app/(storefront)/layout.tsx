import SiteHeader from "@/components/layout/SiteHeader";
import AnnouncementBar from "@/components/homepage/AnnouncementBar";
import StorefrontFooter from "@/components/homepage/StorefrontFooter";
import Navbar from "@/components/layout/Navbar";
import StorefrontProviders from "@/components/layout/StorefrontProviders";
import { getServerSession } from "@/lib/auth/session";
import { getWishlistProductIds } from "@/lib/storefront/wishlist-actions";

/**
 * Storefront-only chrome — cart, wishlist, navbar, and footer are not loaded on /admin routes.
 */
export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [wishlistIds, initialSession] = await Promise.all([
    getWishlistProductIds(),
    getServerSession(),
  ]);

  return (
    <StorefrontProviders wishlistIds={wishlistIds} initialSession={initialSession}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-green-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-terra-500"
      >
        Skip to main content
      </a>
      <SiteHeader announcement={<AnnouncementBar />}>
        <Navbar />
      </SiteHeader>
      <main id="main-content" className="site-main-offset">
        {children}
      </main>
      <StorefrontFooter />
    </StorefrontProviders>
  );
}
