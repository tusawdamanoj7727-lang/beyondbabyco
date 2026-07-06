import type { Metadata } from "next";

import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import MascotsHubGrid from "@/components/mascots/MascotsHubGrid";
import JsonLd from "@/components/seo/JsonLd";
import { MASCOTS } from "@/lib/brand/copy";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Meet Our Mascots",
  description: MASCOTS.intro,
  path: "/mascots",
});

export default function MascotsHubPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Mascots" },
          ]),
        ]}
      />
      <CatalogBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Mascots" },
        ]}
      />
      <MascotsHubGrid />
    </>
  );
}
