import Image from "next/image";

import HomeSection from "@/components/homepage/HomeSection";
import HomeSectionHeader from "@/components/homepage/HomeSectionHeader";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Card from "../ui/Card";
import BrandSceneImage from "@/components/brand/BrandSceneImage";
import { IMAGES } from "@/lib/images";
import { SCIENCE_SECTION } from "@/lib/brand/copy";

import { editorialImageCrop } from "@/lib/design/ui";
import { IMAGE_DIMENSIONS, IMAGE_QUALITY, IMAGE_SIZES, fixedImageSizes, mascotImageQuality, resolveImageBlur } from "@/lib/media/image-delivery";
import { STATIC_IMAGE_BLUR } from "@/lib/media/image-placeholder";
import type { ScienceConfig } from "@/lib/admin/homepage-schema";

const FEATURE_ACCENTS = ["bg-green-200/80", "bg-terra-200/80", "bg-cream-300/80"];

const SCIENCE_FEATURE_IMAGES = [
  IMAGES.research.lab,
  IMAGES.research.testing,
  IMAGES.research.ingredients,
] as const;

const DEFAULT_FEATURES = SCIENCE_SECTION.features.map((feature, index) => ({
  ...feature,
  accent: FEATURE_ACCENTS[index] ?? "bg-green-200/80",
  imageUrl: SCIENCE_FEATURE_IMAGES[index] ?? IMAGES.research.lab,
}));

export default function ScienceSection({ config }: { config?: ScienceConfig }) {
  const heading = config?.heading?.trim() || SCIENCE_SECTION.heading;
  const description = config?.description?.trim() || SCIENCE_SECTION.description;
  const imageUrl = config?.imageUrl?.trim() || IMAGES.research.lab;

  const features =
    config?.features && config.features.length > 0
      ? config.features.map((feature, index) => ({
          title: feature.title,
          description: feature.description,
          accent: FEATURE_ACCENTS[index % FEATURE_ACCENTS.length] ?? "bg-green-200/80",
          imageUrl: SCIENCE_FEATURE_IMAGES[index % SCIENCE_FEATURE_IMAGES.length] ?? IMAGES.research.lab,
        }))
      : DEFAULT_FEATURES;

  return (
    <HomeSection id="science" tone="white" className="relative overflow-visible">
      <div
        className="pointer-events-none absolute bottom-8 left-0 z-20 hidden select-none xl:block"
        aria-hidden="true"
      >
        <Image
          src="/icons/eli-elephant/studying.webp"
          alt=""
          width={IMAGE_DIMENSIONS.decorativeMascot.width}
          height={IMAGE_DIMENSIONS.decorativeMascot.height}
          loading="lazy"
          sizes={fixedImageSizes(140)}
          quality={mascotImageQuality(140)}
          className="animate-float-slow object-contain drop-shadow-xl"
          style={{
            background: "transparent",
            filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.12))",
          }}
        />
      </div>
      <div className="homepage-split-grid grid grid-cols-1 items-center lg:grid-cols-2">
        <ScrollReveal className="w-full">
          <div className="relative">
            <Card
              as="div"
              variant="glass"
              radius="4xl"
              padding="none"
              className="premium-image-frame homepage-media-frame relative aspect-[4/5] w-full overflow-hidden"
            >
              <BrandSceneImage
                variant="science"
                imageUrl={imageUrl}
                alt="Research-backed baby care"
                sizes={IMAGE_SIZES.lifestyleHero}
                quality={IMAGE_QUALITY.editorial}
                imageClassName={editorialImageCrop}
              />
            </Card>

            <div aria-hidden="true" className="hero-stat-card absolute left-0 top-6 z-20 rounded-[var(--radius-card)] px-4 py-3 sm:-left-4">
              <span className="block font-heading text-lg font-extrabold leading-none text-green-700">
                {SCIENCE_SECTION.stat.value}
              </span>
              <span className="mt-1 block font-body text-xs text-green-600">
                {SCIENCE_SECTION.stat.label}
              </span>
            </div>
          </div>
        </ScrollReveal>

        <div className="flex w-full flex-col">
          <HomeSectionHeader
            eyebrow={SCIENCE_SECTION.eyebrow}
            heading={heading}
            intro={description}
            align="left"
            className="mb-0"
          />

          <ul className="homepage-section-grid flex flex-col gap-4">
            {features.map((feature, index) => (
              <li key={feature.title}>
                <ScrollReveal delayMs={index * 50}>
                <Card as="div" variant="glass" radius="3xl" padding="md" hover className="homepage-card">
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className={`premium-image-frame mt-0.5 h-14 w-14 shrink-0 overflow-hidden rounded-2xl ${feature.accent}`}
                    >
                      <Image
                        src={feature.imageUrl}
                        alt=""
                        width={IMAGE_DIMENSIONS.featureIcon.width}
                        height={IMAGE_DIMENSIONS.featureIcon.height}
                        loading="lazy"
                        sizes={fixedImageSizes(56)}
                        quality={IMAGE_QUALITY.thumbnail}
                        placeholder="blur"
                        blurDataURL={resolveImageBlur(STATIC_IMAGE_BLUR)}
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <div>
                      <h3 className="text-card-title">{feature.title}</h3>
                      <p className="prose-measure mt-2 text-sm leading-[1.75] text-green-700/85">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
                </ScrollReveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </HomeSection>
  );
}
