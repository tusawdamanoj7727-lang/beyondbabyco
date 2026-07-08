import Image from "next/image";

import HomeSection from "@/components/homepage/HomeSection";
import HomeSectionHeader from "@/components/homepage/HomeSectionHeader";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Card from "../ui/Card";
import BrandSceneImage from "@/components/brand/BrandSceneImage";
import { IMAGES } from "@/lib/images";
import { LIFESTYLE_SECTION } from "@/lib/brand/copy";

import type { LifestyleConfig } from "@/lib/admin/homepage-schema";
import { editorialImageCrop } from "@/lib/design/ui";
import { IMAGE_DIMENSIONS, IMAGE_QUALITY, IMAGE_SIZES, resolveImageBlur } from "@/lib/media/image-delivery";
import { STATIC_IMAGE_BLUR } from "@/lib/media/image-placeholder";

const FEATURE_ACCENTS = ["bg-green-100/90", "bg-terra-100/90", "bg-cream-200/90"];

const LIFESTYLE_IMAGES = [
  { src: IMAGES.lifestyle.bath_routine, title: "Bath Time", desc: "Gentle cleansing ritual" },
  { src: IMAGES.lifestyle.massage_time, title: "Massage Time", desc: "Bonding through touch" },
  { src: IMAGES.lifestyle.sleep_time, title: "Sleep Time", desc: "Soft routines for rest" },
  { src: IMAGES.lifestyle.play_time, title: "Play Time", desc: "Safe for active days" },
  { src: IMAGES.lifestyle.feeding_time, title: "After Bath", desc: "Lock in moisture" },
  { src: IMAGES.lifestyle.outdoor, title: "Outdoor", desc: "Protection on the go" },
] as const;

const DEFAULT_FEATURES = LIFESTYLE_IMAGES.map((item, index) => ({
  icon: "",
  title: item.title,
  description: item.desc,
  accent: FEATURE_ACCENTS[index % FEATURE_ACCENTS.length] ?? "bg-green-100/90",
  imageUrl: item.src,
}));

export default function LifestyleSection({ config }: { config?: LifestyleConfig }) {
  const heading = config?.heading?.trim() || LIFESTYLE_SECTION.heading;
  const description = config?.description?.trim() || LIFESTYLE_SECTION.description;
  const imageUrl = config?.imageUrl?.trim() || IMAGES.lifestyle.bath_routine;

  const features =
    config?.cards && config.cards.length > 0
      ? config.cards.map((card, index) => ({
          icon: "",
          imageUrl: card.imageUrl?.trim() || LIFESTYLE_IMAGES[index % LIFESTYLE_IMAGES.length]?.src,
          title: card.title,
          description: card.description,
          accent: FEATURE_ACCENTS[index % FEATURE_ACCENTS.length] ?? "bg-green-100/90",
        }))
      : DEFAULT_FEATURES;

  return (
    <HomeSection tone="cream">
      <HomeSectionHeader
        eyebrow={LIFESTYLE_SECTION.eyebrow}
        heading={heading}
        intro={description}
      />

      <div className="homepage-section-grid homepage-split-grid grid grid-cols-1 items-center lg:grid-cols-2">
        <div className="order-2 flex w-full flex-col gap-4 lg:order-1">
          {features.map((feature, index) => (
            <ScrollReveal key={feature.title} delayMs={index * 60}>
              <Card as="div" variant="glass" radius="3xl" padding="md" hover className="homepage-card">
                <span
                  aria-hidden="true"
                  className={`premium-image-frame inline-flex h-12 w-12 items-center justify-center overflow-hidden ${feature.accent}`}
                >
                  {feature.imageUrl ? (
                    <Image
                      src={feature.imageUrl}
                      alt=""
                      width={IMAGE_DIMENSIONS.sectionThumbnail.width}
                      height={IMAGE_DIMENSIONS.sectionThumbnail.height}
                      loading="lazy"
                      sizes={IMAGE_SIZES.lifestyleThumbnail}
                      quality={IMAGE_QUALITY.thumbnail}
                      placeholder="blur"
                      blurDataURL={resolveImageBlur(STATIC_IMAGE_BLUR)}
                      className="h-full w-full object-cover object-[center_25%]"
                    />
                  ) : null}
                </span>
                <h3 className="text-card-title mt-4">{feature.title}</h3>
                <p className="prose-measure mt-2.5 text-sm leading-[1.75] text-green-700/85">
                  {feature.description}
                </p>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="order-1 w-full lg:order-2">
          <Card
            as="div"
            variant="glass"
            radius="4xl"
            padding="none"
            className="premium-image-frame homepage-media-frame relative aspect-[4/5] w-full overflow-hidden"
          >
            <BrandSceneImage
              variant="lifestyle"
              imageUrl={imageUrl}
              alt="Everyday family moments"
              sizes={IMAGE_SIZES.lifestyleHero}
              quality={IMAGE_QUALITY.editorial}
              imageClassName={editorialImageCrop}
            />
          </Card>
        </ScrollReveal>
      </div>
    </HomeSection>
  );
}
