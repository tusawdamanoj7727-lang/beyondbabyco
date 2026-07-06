import type { Metadata } from "next";
import { notFound } from "next/navigation";

import MascotDetailView from "@/components/mascots/MascotDetailView";
import JsonLd from "@/components/seo/JsonLd";
import {
  getStorefrontProductsBySlugs,
  listStorefrontProducts,
} from "@/lib/catalog/storefront";
import { getAllMascotProfiles, getMascotProfile } from "@/lib/mascots/profiles";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllMascotProfiles().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const mascot = getMascotProfile(slug);
  if (!mascot) return {};

  return buildPageMetadata({
    title: `Meet ${mascot.fullName}`,
    description: mascot.tagline,
    path: `/mascots/${slug}`,
    image: mascot.heroImage,
  });
}

export default async function MascotDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const mascot = getMascotProfile(slug);
  if (!mascot) notFound();

  let products = await getStorefrontProductsBySlugs(mascot.associatedProducts);

  if (products.length === 0) {
    const catalog = await listStorefrontProducts({ category: mascot.categorySlug, page: 1 });
    products = catalog.products.slice(0, 4);
  }

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Mascots", url: "/mascots" },
            { name: mascot.fullName },
          ]),
        ]}
      />
      <MascotDetailView mascot={mascot} products={products} />
    </>
  );
}
