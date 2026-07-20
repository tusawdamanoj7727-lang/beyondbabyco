import Link from "next/link";

import JsonLd from "@/components/seo/JsonLd";
import {
  EDUCATION_ARTICLES,
  EDUCATION_CATEGORY_LABELS,
} from "@/lib/content/education";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Learn",
  description:
    "Parent education from BeyondBabyCo — baby skincare basics, bath routines, newborn essentials, and gentle product usage guides.",
  path: "/learn",
  keywords: ["baby skincare", "newborn care", "bath routine", "BeyondBabyCo guides"],
});

export default function LearnHubPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Learn" },
        ])}
      />
      <div className="min-h-screen bg-brand-cream">
        <header className="border-b border-green-100/80 bg-gradient-to-b from-white to-cream-50">
          <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-16">
            <p className="text-eyebrow text-terra-600">Education hub</p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-green-900 sm:text-5xl">
              Learn with BeyondBabyCo
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-green-800 sm:text-lg">
              Short, practical guides for everyday baby care — written to grow with our research and
              product education. Start here, then explore ingredients and safety standards.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/ingredients"
                className="inline-flex min-h-11 items-center rounded-full bg-green-800 px-5 text-sm font-semibold text-white hover:bg-green-900"
              >
                Ingredient library
              </Link>
              <Link
                href="/trust-center"
                className="inline-flex min-h-11 items-center rounded-full border border-green-200 bg-white px-5 text-sm font-semibold text-green-800 hover:border-green-300"
              >
                Trust Center
              </Link>
              <Link
                href="/help"
                className="inline-flex min-h-11 items-center rounded-full border border-green-200 bg-white px-5 text-sm font-semibold text-green-800 hover:border-green-300"
              >
                Help Center
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto max-w-5xl px-4 py-12">
          <ul className="grid gap-4 sm:grid-cols-2">
            {EDUCATION_ARTICLES.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/learn/${article.slug}`}
                  className="flex h-full flex-col rounded-3xl border border-green-100 bg-white/95 p-6 shadow-sm transition-colors hover:border-green-200 hover:bg-white"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-terra-600">
                    {EDUCATION_CATEGORY_LABELS[article.category]}
                  </p>
                  <h2 className="mt-2 font-heading text-xl font-bold text-green-900">{article.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-green-700">{article.description}</p>
                  <p className="mt-4 text-xs font-medium text-green-600">
                    {article.readingMinutes} min read →
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
