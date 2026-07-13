import Link from "next/link";

import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Our Research",
  description:
    "Five years of ingredient research, dermatological testing, and formulation work behind every BeyondBabyCo product.",
  path: "/research",
});

export default function ResearchPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Our Research" },
        ])}
      />
      <div className="min-h-screen bg-brand-cream py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-3 text-4xl font-black text-brand-forest">Our Research</h1>
        <p className="mb-10 text-gray-500">Science-first baby care — developed over five years</p>

        <div className="prose prose-green max-w-none rounded-2xl bg-white p-8 shadow-sm prose-headings:text-brand-forest">
          <p className="text-lg leading-relaxed text-gray-700">
            Every BeyondBabyCo product begins with research — not trends. Before launch, we studied
            ingredient safety, skin compatibility, and everyday use cases with dermatological advisors
            and parent feedback across India.
          </p>

          <h2>What we research</h2>
          <ul>
            <li>Ingredient sourcing and INCI transparency</li>
            <li>Dermatological testing for delicate baby skin</li>
            <li>Formulation stability in Indian climates</li>
            <li>Parent usability — texture, scent, and routine fit</li>
          </ul>

          <h2>Explore our products</h2>
          <p>
            <Link href="/products" className="font-semibold text-brand-forest no-underline hover:underline">
              Shop the collection →
            </Link>
          </p>
        </div>
      </div>
      </div>
    </>
  );
}
