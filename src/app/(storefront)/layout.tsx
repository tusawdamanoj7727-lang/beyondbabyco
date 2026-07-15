import StorefrontProviders from "@/components/layout/StorefrontProviders";

/**
 * Storefront chrome — cart/wishlist hydrate on the client.
 * Avoid server wishlist/auth lookups here so public catalog pages stay ISR-eligible.
 */
export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StorefrontProviders wishlistIds={[]}>
      <a href="#main-content" className="a11y-skip-link">
        Skip to main content
      </a>
      <main id="main-content" className="site-main-offset">
        {children}
      </main>
    </StorefrontProviders>
  );
}
