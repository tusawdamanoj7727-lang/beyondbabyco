import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ContentHero from "@/components/content/ContentHero";
import ContentPageRenderer from "@/components/content/ContentPageRenderer";
import JsonLd from "@/components/seo/JsonLd";
import { DEDICATED_CONTENT_SLUGS } from "@/lib/content/dedicated-routes";
import {
  getAllContentSlugs,
  getAllFaqItems,
  getContentPage,
} from "@/lib/content/registry";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllContentSlugs()
    .filter((slug) => !DEDICATED_CONTENT_SLUGS.has(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getContentPage(slug);
  if (!page) return {};

  return buildPageMetadata({
    title: page.title,
    description: page.description,
    path: `/${page.slug}`,
    image: page.heroImage,
  });
}

export default async function MarketingContentPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getContentPage(slug);
  if (!page) notFound();

  const path = `/${page.slug}`;
  const jsonLdItems: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: "Home", url: "/" },
      { name: page.title },
    ]),
  ];

  if (page.jsonLd === "faq") {
    const faqs = getAllFaqItems(page);
    const faqSchema = faqJsonLd(faqs);
    if (faqSchema) jsonLdItems.push(faqSchema);
  }

  if (page.jsonLd === "article") {
    jsonLdItems.push(
      articleJsonLd({
        title: page.title,
        description: page.description,
        path,
      }),
    );
  }

  return (
    <>
      <JsonLd data={jsonLdItems} />
      <ContentHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
        heroImage={page.heroImage}
        breadcrumbLabel={page.title}
      />
      <ContentPageRenderer page={page} />
    </>
  );
}
