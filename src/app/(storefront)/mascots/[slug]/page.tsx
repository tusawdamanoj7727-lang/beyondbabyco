import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/seo/JsonLd";
import { fixedImageSizes, IMAGE_QUALITY } from "@/lib/media/image-delivery";
import { getMascotContent, MASCOT_SLUGS, MASCOTS } from "@/lib/mascots/content";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return MASCOT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const mascot = getMascotContent(slug);
  if (!mascot) return {};

  return buildPageMetadata({
    title: `Meet ${mascot.name}`,
    description: mascot.tagline,
    path: `/mascots/${slug}`,
    image: mascot.celebrationImg,
  });
}

export default async function MascotPage({ params }: PageProps) {
  const { slug } = await params;
  const mascot = MASCOTS[slug];
  if (!mascot) return notFound();

  const firstName = mascot.name.split(" ")[0];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Mascots", url: "/mascots" },
            { name: mascot.name },
          ]),
        ]}
      />
      <div className="min-h-screen bg-brand-cream">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="mb-16 grid items-center gap-12 md:grid-cols-2">
            <div className="text-center">
              <Image
                src={mascot.celebrationImg}
                alt={mascot.name}
                width={400}
                height={400}
                sizes={fixedImageSizes(400)}
                quality={IMAGE_QUALITY.mascot}
                className="mx-auto animate-float object-contain drop-shadow-2xl"
                priority
              />
            </div>
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-brand-terra">
                {mascot.personality}
              </span>
              <h1 className="mb-3 mt-2 text-5xl font-black text-brand-forest">{mascot.name}</h1>
              <p className="mb-6 text-xl italic text-gray-600">&ldquo;{mascot.tagline}&rdquo;</p>
              <p className="mb-8 leading-relaxed text-gray-600">{mascot.story}</p>

              {mascot.products.length > 0 ? (
                <div className="mb-8">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-600">
                    {firstName}&apos;s picks
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mascot.products.map((product) => (
                      <span
                        key={product}
                        className="rounded-full px-4 py-1.5 text-sm font-medium text-brand-forest"
                        style={{ backgroundColor: `${mascot.color}40` }}
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <Link
                href="/products"
                className="inline-block rounded-2xl bg-brand-forest px-8 py-4 font-bold text-white transition-all hover:bg-green-800"
              >
                Shop {firstName}&apos;s Picks →
              </Link>
            </div>
          </div>

          <div className="text-center">
            <p className="mb-6 text-sm text-gray-600">Meet the whole family</p>
            <Link href="/mascots" className="font-semibold text-brand-forest hover:underline">
              View All Mascots →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
