import Link from "next/link";

import JsonLd from "@/components/seo/JsonLd";
import { STOREFRONT_FAQ_ITEMS } from "@/lib/content/faq-items";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "FAQ",
  description: "Frequently asked questions about BeyondBabyCo baby care products, orders, and policies.",
  path: "/faq",
  keywords: ["BeyondBabyCo FAQ", "baby care questions", "shipping and returns", "newborn products"],
});

export default function FaqPage() {
  const faqSchema = faqJsonLd(STOREFRONT_FAQ_ITEMS);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "FAQ" },
          ]),
          ...(faqSchema ? [faqSchema] : []),
        ]}
      />
      <div className="min-h-screen bg-brand-cream py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="mb-3 font-heading text-4xl font-black text-brand-forest">
            Frequently Asked Questions
          </h1>
          <p className="mb-4 text-caption text-green-700">
            Answers to common questions from parents like you
          </p>
          <p className="mb-10 text-sm text-green-700">
            Prefer topics grouped by ordering, shipping, and returns?{" "}
            <Link href="/help" className="font-semibold text-terra-600 hover:underline">
              Open the Help Center
            </Link>
            .
          </p>
          <div role="region" aria-label="Frequently asked questions" className="space-y-4">
            {STOREFRONT_FAQ_ITEMS.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-[var(--radius-card)] bg-white p-6 shadow-sm open:shadow-md"
              >
                <summary className="cursor-pointer list-none font-semibold text-gray-900 marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-4">
                    {faq.question}
                    <span className="text-brand-forest transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-gray-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
