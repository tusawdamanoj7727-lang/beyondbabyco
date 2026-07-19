import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/seo/JsonLd";
import {
  getAllIngredientIds,
  getIngredientById,
} from "@/lib/trust/ingredients";
import { blurForGeneratedUrl } from "@/lib/brand/generated-blur";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

type PageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return getAllIngredientIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const ingredient = getIngredientById(id);
  if (!ingredient) return {};
  return buildPageMetadata({
    title: `${ingredient.name} — Ingredient`,
    description: ingredient.purpose,
    path: `/ingredients/${ingredient.id}`,
    image: ingredient.image,
  });
}

export default async function IngredientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ingredient = getIngredientById(id);
  if (!ingredient) notFound();

  const path = `/ingredients/${ingredient.id}`;
  const faqSchema = faqJsonLd(ingredient.faqs);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Ingredients", url: "/ingredients" },
            { name: ingredient.name },
          ]),
          articleJsonLd({
            title: ingredient.name,
            description: ingredient.purpose,
            path,
          }),
          ...(faqSchema ? [faqSchema] : []),
        ]}
      />
      <article className="min-h-screen bg-brand-cream pb-16">
        <div className="container mx-auto max-w-4xl px-4 py-10 sm:py-14">
          <p className="text-eyebrow text-terra-600">Ingredient transparency</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-green-900 sm:text-4xl">
            {ingredient.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-green-700">{ingredient.purpose}</p>

          <div className="relative mt-8 aspect-[21/9] overflow-hidden rounded-3xl border border-green-100 bg-white">
            <Image
              src={ingredient.image}
              alt={ingredient.imageAlt}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              placeholder="blur"
              blurDataURL={resolveImageBlur(blurForGeneratedUrl(ingredient.image))}
              className="object-cover"
            />
          </div>

          <dl className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-green-100 bg-white p-5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-green-600">Origin</dt>
              <dd className="mt-2 text-sm leading-relaxed text-green-800">{ingredient.origin}</dd>
            </div>
            <div className="rounded-2xl border border-green-100 bg-white p-5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-green-600">Suitable age</dt>
              <dd className="mt-2 text-sm font-semibold text-green-900">{ingredient.suitableAge}</dd>
            </div>
            <div className="rounded-2xl border border-green-100 bg-white p-5 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-green-600">
                Baby-safe explanation
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-green-800">
                {ingredient.babySafeExplanation}
              </dd>
            </div>
            <div className="rounded-2xl border border-green-100 bg-white p-5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-green-600">Safety</dt>
              <dd className="mt-2 text-sm leading-relaxed text-green-800">{ingredient.safetyProfile}</dd>
            </div>
            <div className="rounded-2xl border border-green-100 bg-white p-5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-green-600">
                Suitable skin types
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-green-800">
                {ingredient.skinCompatibility}
              </dd>
            </div>
          </dl>

          <section className="mt-10" aria-labelledby="benefits-heading">
            <h2 id="benefits-heading" className="font-heading text-xl font-bold text-green-900">
              Benefits
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-green-800">
              {ingredient.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>

          <section className="mt-10" aria-labelledby="research-heading">
            <h2 id="research-heading" className="font-heading text-xl font-bold text-green-900">
              Research summary
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-green-800">{ingredient.researchSummary}</p>
          </section>

          {ingredient.faqs.length ? (
            <section className="mt-10" aria-labelledby="ing-faq-heading">
              <h2 id="ing-faq-heading" className="font-heading text-xl font-bold text-green-900">
                Frequently asked questions
              </h2>
              <div className="mt-4 space-y-3">
                {ingredient.faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm"
                  >
                    <summary className="cursor-pointer font-semibold text-green-900">{faq.question}</summary>
                    <p className="mt-2 text-sm leading-relaxed text-green-700">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-10" aria-labelledby="related-heading">
            <h2 id="related-heading" className="font-heading text-xl font-bold text-green-900">
              Related
            </h2>
            <ul className="mt-3 flex flex-wrap gap-3">
              {ingredient.relatedProducts.map((p) => (
                <li key={p.name}>
                  <Link
                    href={p.href}
                    className="inline-flex min-h-10 items-center rounded-full border border-green-200 bg-white px-4 text-sm font-semibold text-green-800"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/ingredients"
                  className="inline-flex min-h-10 items-center rounded-full bg-green-800 px-4 text-sm font-semibold text-white"
                >
                  All ingredients
                </Link>
              </li>
              <li>
                <Link
                  href="/learn"
                  className="inline-flex min-h-10 items-center rounded-full border border-green-200 px-4 text-sm font-semibold text-green-800"
                >
                  Learn hub
                </Link>
              </li>
              <li>
                <Link
                  href="/trust-center"
                  className="inline-flex min-h-10 items-center rounded-full border border-green-200 px-4 text-sm font-semibold text-green-800"
                >
                  Trust Center
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </article>
    </>
  );
}
