import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ContentHero from "@/components/content/ContentHero";
import ContentPageRenderer from "@/components/content/ContentPageRenderer";
import JsonLd from "@/components/seo/JsonLd";
import { getAllFaqItems, getContentPage } from "@/lib/content/registry";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export function buildContentPageMetadata(slug: string): Metadata {
  const page = getContentPage(slug);
  if (!page) return {};

  return buildPageMetadata({
    title: page.title,
    description: page.description,
    path: `/${slug}`,
    image: page.heroImage,
  });
}

export default function ContentPageView({ slug }: { slug: string }) {
  const page = getContentPage(slug);
  if (!page) notFound();

  const path = `/${slug}`;
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
