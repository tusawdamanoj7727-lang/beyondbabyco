import type { Metadata } from "next";

import MascotHubCard from "@/components/mascots/MascotHubCard";
import JsonLd from "@/components/seo/JsonLd";
import { MASCOTS } from "@/lib/brand/copy";
import { MASCOT_SLUGS, MASCOTS as MASCOT_CONTENT } from "@/lib/mascots/content";
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
      <div className="min-h-screen bg-gradient-to-b from-brand-cream to-green-50">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-16 text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-brand-terra">
              {MASCOTS.eyebrow}
            </span>
            <h1 className="mb-4 mt-3 text-5xl font-black text-brand-forest">Meet the BeyondBabyCo Family</h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-500">{MASCOTS.intro}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {MASCOT_SLUGS.map((slug, index) => (
              <MascotHubCard key={slug} slug={slug} mascot={MASCOT_CONTENT[slug]} delay={index * 0.15} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
