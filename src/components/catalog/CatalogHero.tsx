import Image from "next/image";

import { EDITORIAL } from "@/lib/brand/generated-assets";
import type { CatalogBanner } from "@/lib/catalog/types";
import { blurForGeneratedUrl } from "@/lib/brand/generated-blur";
import { IMAGE_QUALITY, IMAGE_SIZES, resolveImageBlur } from "@/lib/media/image-delivery";

export default function CatalogHero({
  banner,
  priorityImage = false,
}: {
  banner: CatalogBanner;
  priorityImage?: boolean;
}) {
  const heroImage = banner.imageUrl ?? EDITORIAL.hero.url;
  const heroBlur = banner.imageUrl ? blurForGeneratedUrl(banner.imageUrl) : EDITORIAL.hero.blur;

  return (
    <section className="collection-hero">
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src={heroImage}
          alt=""
          fill
          priority={priorityImage}
          fetchPriority={priorityImage ? "high" : undefined}
          loading={priorityImage ? undefined : "lazy"}
          sizes={IMAGE_SIZES.sectionBackground}
          quality={IMAGE_QUALITY.decorativeHero}
          placeholder="blur"
          blurDataURL={resolveImageBlur(heroBlur)}
          className="object-cover object-center opacity-25"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-green-950/95 via-green-900/82 to-green-900/55"
      />
      <div className="container collection-hero-inner">
        <p className="collection-hero-eyebrow">{banner.subtitle}</p>
        <h1 className="collection-hero-title">{banner.title}</h1>
        <p className="collection-hero-intro">{banner.description}</p>
      </div>
    </section>
  );
}
