import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "My Account",
  description: "Manage orders, profile, addresses, and wishlist.",
  path: "/account",
  noIndex: true,
});

/** Match storefront `site-main-offset` so the fixed header never covers content. */
export default function AccountHubLayout({ children }: { children: React.ReactNode }) {
  return <div className="site-main-offset">{children}</div>;
}
