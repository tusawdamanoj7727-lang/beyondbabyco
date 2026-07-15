import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist } from "next/font/google";

import JsonLd from "@/components/seo/JsonLd";
import StorefrontFooter from "@/components/homepage/StorefrontFooter";
import AppProviders from "@/components/layout/AppProviders";
import HideOnAdmin from "@/components/layout/HideOnAdmin";
import AnnouncementBar from "@/components/homepage/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import ResourceHints from "@/components/seo/ResourceHints";
import {
  AnalyticsRoot,
  AppToaster,
  FloatingLogo,
  ScrollRevealObserver,
  WhatsAppButton,
} from "@/components/layout/DeferredClientWidgets";
import { getSearchConsoleVerificationMeta } from "@/lib/analytics/integrations";
import { getCanonicalSiteUrl } from "@/lib/seo/site";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BRAND } from "@/lib/brand/copy";
import {
  BRAND_APPLE_TOUCH_ICON,
  BRAND_FAVICON_16,
  BRAND_FAVICON_32,
  BRAND_FAVICON_48,
  BRAND_ICON_192,
  BRAND_ICON_512,
} from "@/lib/brand/logo";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(getCanonicalSiteUrl()),
  ...buildPageMetadata({
    title: BRAND.siteTitle,
    path: "/",
  }),
  ...(getSearchConsoleVerificationMeta()
    ? { verification: { google: getSearchConsoleVerificationMeta()!.content } }
    : {}),
  icons: {
    icon: [
      { url: BRAND_FAVICON_16, sizes: "16x16", type: "image/png" },
      { url: BRAND_FAVICON_32, sizes: "32x32", type: "image/png" },
      { url: BRAND_FAVICON_48, sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: BRAND_APPLE_TOUCH_ICON, sizes: "180x180", type: "image/png" }],
    other: [
      { rel: "icon", url: BRAND_ICON_192, sizes: "192x192", type: "image/png" },
      { rel: "icon", url: BRAND_ICON_512, sizes: "512x512", type: "image/png" },
    ],
  },
};

/** Reserves announcement ticker height while CMS data streams — prevents header CLS. */
function AnnouncementBarFallback() {
  return <div className="announcement-bar shrink-0" aria-hidden="true" />;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Do not await Auth here — cookies()/getUser() would force dynamic HTML for every visitor
  // and add Auth TTFB. Client AuthProvider hydrates from local session via onAuthStateChange.
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <ResourceHints />
      </head>
      <body className="overflow-x-hidden font-body antialiased bg-background text-foreground">
        <AppProviders initialSession={null}>
          <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
          <AnalyticsRoot />
          <ScrollRevealObserver />
          <AppToaster />
          <HideOnAdmin>
            <div className="site-header fixed inset-x-0 top-0 z-50 flex flex-col">
              <Suspense fallback={<AnnouncementBarFallback />}>
                <AnnouncementBar />
              </Suspense>
              <Navbar />
            </div>
          </HideOnAdmin>
          {children}
          <HideOnAdmin>
            <FloatingLogo />
          </HideOnAdmin>
          <HideOnAdmin>
            <Suspense fallback={null}>
              <StorefrontFooter />
            </Suspense>
          </HideOnAdmin>
          <WhatsAppButton />
        </AppProviders>
      </body>
    </html>
  );
}
