import Image from "next/image";

import HomeSection from "@/components/homepage/HomeSection";
import HomeSectionHeader from "@/components/homepage/HomeSectionHeader";
import NotifyMeButton from "@/components/homepage/NotifyMeButton";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { beyondCarePhotos } from "@/lib/homepage/visual-assets";
import { IMAGE_QUALITY, IMAGE_SIZES, resolveImageBlur } from "@/lib/media/image-delivery";

const CARE_LINES = [
  {
    title: "Men Care",
    description:
      "Research-led grooming and wellness essentials — formulated with the same safety standards as our baby line.",
    image: beyondCarePhotos.men,
    blur: beyondCarePhotos.menBlur,
  },
  {
    title: "Women Care",
    description:
      "Gentle, dermatologically considered care for everyday rituals — launching after our baby collection.",
    image: beyondCarePhotos.women,
    blur: beyondCarePhotos.womenBlur,
  },
] as const;

export default function BeyondCareLinesSection() {
  return (
    <HomeSection id="beyond-care" tone="cream">
      <HomeSectionHeader
        eyebrow="Beyond Baby Care"
        heading="Launching Soon"
        intro="The same research discipline that shaped our baby care line is expanding to thoughtful essentials for the whole family."
      />

      <div className="homepage-section-grid grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        {CARE_LINES.map((line, index) => (
          <ScrollReveal key={line.title} delayMs={index * 70} className="h-full">
            <Card
              as="article"
              variant="glass"
              radius="4xl"
              padding="none"
              hover
              fullHeight
              className="homepage-card group overflow-hidden"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={line.image}
                  alt=""
                  fill
                  loading="lazy"
                  sizes={IMAGE_SIZES.lifestyleHero}
                  quality={IMAGE_QUALITY.editorial}
                  placeholder="blur"
                  blurDataURL={resolveImageBlur(line.blur)}
                  className="object-cover object-[center_24%] transition-transform duration-[var(--duration-card)] ease-[var(--ease-out)] group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-950/50 via-green-900/8 to-transparent" />
                <Badge variant="comingSoon" size="sm" className="absolute left-4 top-4">
                  Coming Soon
                </Badge>
              </div>
              <div className="flex flex-col p-5 lg:p-6">
                <h3 className="font-heading text-[clamp(1.375rem,2.2vw,1.75rem)] font-bold text-green-900">
                  {line.title}
                </h3>
                <p className="mt-2.5 font-body text-base leading-relaxed text-green-700/88">{line.description}</p>
                <p className="mt-2 font-body text-sm font-medium text-terra-600">
                  Launching 2026 · Research complete
                </p>
                <div className="mt-5">
                  <NotifyMeButton productCategory={line.title} label="Notify Me" />
                </div>
              </div>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </HomeSection>
  );
}
