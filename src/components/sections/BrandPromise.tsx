import Image from "next/image";

import HomeSection from "@/components/homepage/HomeSection";
import HomeSectionHeader from "@/components/homepage/HomeSectionHeader";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Card from "../ui/Card";
import { BRAND_PROMISE } from "@/lib/brand/copy";
import { homepageGridGap } from "@/lib/design/ui";
import { cn } from "@/lib/utils";
import { BRAND_PROMISE_DEFAULTS } from "../../lib/data";
import { blurForGeneratedUrl } from "@/lib/brand/generated-assets";
import { IMAGE_QUALITY, IMAGE_SIZES, resolveImageBlur } from "@/lib/media/image-delivery";
import type { BrandPromiseConfig } from "@/lib/admin/homepage-schema";
import HomepageMascotGuide from "@/components/mascots/HomepageMascotGuide";

const DEFAULT_CARDS = BRAND_PROMISE_DEFAULTS.map((card) => ({
  ...card,
  icon: "",
}));

export default function BrandPromise({ config }: { config?: BrandPromiseConfig }) {
  const heading = config?.heading?.trim() || BRAND_PROMISE.heading;
  const description = config?.description?.trim() || BRAND_PROMISE.description;

  const cards =
    config?.cards && config.cards.length > 0
      ? config.cards.map((card, index) => ({
          icon: "",
          imageUrl: card.imageUrl?.trim() || BRAND_PROMISE_DEFAULTS[index]?.imageUrl || null,
          title: card.title,
          description: card.description,
        }))
      : DEFAULT_CARDS;

  const backgroundUrl = config?.backgroundUrl?.trim();

  return (
    <HomeSection id="about" tone="cream" className="overflow-visible">
      <HomepageMascotGuide
        mascot="poppy-panda"
        pose="hug"
        size={170}
        placementClassName="-right-4 bottom-8 xl:-right-10"
        floating
      />
      {backgroundUrl ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] opacity-[0.22]">
          <Image
            src={backgroundUrl}
            alt=""
            fill
            loading="lazy"
            sizes="100vw"
            quality={IMAGE_QUALITY.editorial}
            placeholder="blur"
            blurDataURL={resolveImageBlur(blurForGeneratedUrl(backgroundUrl))}
            className="object-cover object-center"
          />
        </div>
      ) : null}

      <HomeSectionHeader
        eyebrow={BRAND_PROMISE.eyebrow}
        heading={heading}
        intro={description}
      />

      <div className={cn("homepage-section-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", homepageGridGap)}>
        {cards.map((card, index) => (
          <ScrollReveal key={card.title} delayMs={index * 60} className="h-full">
            <Card
              as="div"
              variant="glass"
              radius="3xl"
              padding="lg"
              hover
              fullHeight
              className="homepage-card text-center"
            >
              <span
                aria-hidden="true"
                className="premium-image-frame relative mx-auto block h-[4.5rem] w-[4.5rem] overflow-hidden"
              >
                {card.imageUrl ? (
                  <Image
                    src={card.imageUrl}
                    alt=""
                    width={400}
                    height={400}
                    loading="lazy"
                    sizes={IMAGE_SIZES.lifestyleThumbnail}
                    quality={IMAGE_QUALITY.editorial}
                    placeholder="blur"
                    blurDataURL={resolveImageBlur(blurForGeneratedUrl(card.imageUrl ?? ""))}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </span>
              <h3 className="text-card-title mt-5">{card.title}</h3>
              <p className="prose-measure mx-auto mt-3 text-sm leading-[1.75] text-green-700/85">
                {card.description}
              </p>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </HomeSection>
  );
}
