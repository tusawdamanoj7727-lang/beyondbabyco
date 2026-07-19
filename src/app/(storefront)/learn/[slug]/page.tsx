import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/seo/JsonLd";
import {
  getAllEducationSlugs,
  getEducationArticle,
} from "@/lib/content/education";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllEducationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = getEducationArticle(slug);
  if (!article) return {};
  return buildPageMetadata({
    title: article.title,
    description: article.description,
    path: `/learn/${article.slug}`,
  });
}

export default async function LearnArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getEducationArticle(slug);
  if (!article) notFound();

  const path = `/learn/${article.slug}`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Learn", url: "/learn" },
            { name: article.title },
          ]),
          articleJsonLd({
            title: article.title,
            description: article.description,
            path,
          }),
        ]}
      />
      <article className="min-h-screen bg-brand-cream pb-16">
        <header className="border-b border-green-100 bg-white/90">
          <div className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
            <p className="text-eyebrow text-terra-600">{article.eyebrow}</p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-green-900 sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-green-700">{article.description}</p>
            <p className="mt-2 text-xs text-green-600">{article.readingMinutes} min read</p>
          </div>
        </header>

        <div className="container mx-auto max-w-3xl space-y-10 px-4 py-10">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-heading text-xl font-bold text-green-900">{section.heading}</h2>
              <div className="mt-3 space-y-3">
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 48)} className="text-base leading-[1.75] text-green-800">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <nav aria-label="Related reading" className="rounded-3xl border border-green-100 bg-white p-6">
            <h2 className="font-heading text-lg font-bold text-green-900">Continue exploring</h2>
            <ul className="mt-3 flex flex-wrap gap-3">
              {article.relatedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-10 items-center rounded-full border border-green-200 px-4 text-sm font-semibold text-green-800 hover:border-green-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/learn"
                  className="inline-flex min-h-10 items-center rounded-full bg-green-800 px-4 text-sm font-semibold text-white hover:bg-green-900"
                >
                  All guides
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </article>
    </>
  );
}
