import HomeSection from "@/components/homepage/HomeSection";
import HomeSectionHeader from "@/components/homepage/HomeSectionHeader";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Card from "../ui/Card";
import BrandSceneImage from "@/components/brand/BrandSceneImage";
import { sciencePhoto } from "@/lib/homepage/visual-assets";
import { SCIENCE_SECTION } from "@/lib/brand/copy";

import { editorialImageCrop } from "@/lib/design/ui";
import { EDITORIAL_IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";
import type { ScienceConfig } from "@/lib/admin/homepage-schema";
import HomepageMascotGuide from "@/components/mascots/HomepageMascotGuide";

const FEATURE_ACCENTS = ["bg-green-200/80", "bg-terra-200/80", "bg-cream-300/80"];

const DEFAULT_FEATURES = SCIENCE_SECTION.features.map((feature, index) => ({
  ...feature,
  accent: FEATURE_ACCENTS[index] ?? "bg-green-200/80",
}));

export default function ScienceSection({ config }: { config?: ScienceConfig }) {
  const heading = config?.heading?.trim() || SCIENCE_SECTION.heading;
  const description = config?.description?.trim() || SCIENCE_SECTION.description;
  const imageUrl = config?.imageUrl?.trim() || sciencePhoto();

  const features =
    config?.features && config.features.length > 0
      ? config.features.map((feature, index) => ({
          title: feature.title,
          description: feature.description,
          accent: FEATURE_ACCENTS[index % FEATURE_ACCENTS.length] ?? "bg-green-200/80",
        }))
      : DEFAULT_FEATURES;

  return (
    <HomeSection id="science" tone="white" className="overflow-visible">
      <HomepageMascotGuide
        mascot="eli-elephant"
        pose="studying"
        size={180}
        placementClassName="-left-6 top-1/2 -translate-y-1/2 xl:-left-12"
      />
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
                quality={EDITORIAL_IMAGE_QUALITY}
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
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${feature.accent}`}
                    />
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
