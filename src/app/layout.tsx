import type { Metadata } from "next";
import { Montserrat, Geist } from "next/font/google";

import JsonLd from "@/components/seo/JsonLd";
import StorefrontFooter from "@/components/homepage/StorefrontFooter";
import HideOnAdmin from "@/components/layout/HideOnAdmin";
import AnnouncementBar from "@/components/homepage/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import ResourceHints from "@/components/seo/ResourceHints";
import AnalyticsRoot from "@/components/analytics/AnalyticsRoot";
import { AppToaster } from "@/components/ui/AppToaster";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { getSearchConsoleVerificationMeta } from "@/lib/analytics/integrations";
import { getSiteUrl } from "@/lib/seo/site";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BRAND } from "@/lib/brand/copy";
import {
  BRAND_APPLE_TOUCH_ICON,
  BRAND_FAVICON_16,
  BRAND_FAVICON_32,
  BRAND_FAVICON_48,
  BRAND_FAVICON_SVG,
  BRAND_ICON_192,
  BRAND_ICON_512,
} from "@/lib/brand/logo";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const montserrat = Montserrat({
  weight: ["300", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
  subsets: ["latin"],
  adjustFontFallback: false,
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  ...buildPageMetadata({
    title: BRAND.siteTitle,
    path: "/",
  }),
  ...(getSearchConsoleVerificationMeta()
    ? { verification: { google: getSearchConsoleVerificationMeta()!.content } }
    : {}),
  icons: {
    icon: [
      { url: BRAND_FAVICON_SVG, type: "image/svg+xml" },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable, montserrat.variable)}>
      <head>
        <ResourceHints />
      </head>
      <body className="overflow-x-hidden font-body antialiased bg-background text-foreground">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <AnalyticsRoot />
        <AppToaster />
        <HideOnAdmin>
          <div className="site-header fixed inset-x-0 top-0 z-50 flex flex-col">
            <AnnouncementBar />
            <Navbar />
          </div>
        </HideOnAdmin>
        {children}
        <HideOnAdmin>
          <StorefrontFooter />
        </HideOnAdmin>
        <WhatsAppButton />
      </body>
    </html>
  );
}
