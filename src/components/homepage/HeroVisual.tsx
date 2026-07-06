import Image from "next/image";

import { HERO_DEFAULT_BLUR, HERO_DEFAULT_IMAGE } from "@/lib/homepage/visual-assets";
import { resolveVisualUrl } from "@/lib/brand/generated-assets";
import { IMAGE_QUALITY, IMAGE_SIZES, fixedImageSizes, resolveImageBlur } from "@/lib/media/image-delivery";
import { resolveMascotAssetSrc } from "@/lib/mascots";
import type { MascotPose, MascotType } from "@/components/mascots/Mascot";
import { cn } from "@/lib/utils";

const HERO_MASCOTS: {
  id: MascotType;
  pose: MascotPose;
  position: string;
  delay: string;
  floatDelay: string;
  size: number;
}[] = [
  {
    id: "bella-bunny",
    pose: "wave" as const,
    position: "hero-mascot--tl",
    delay: "",
    floatDelay: "0s",
    size: 106,
  },
  {
    id: "gigi-giraffe",
    pose: "welcome" as const,
    position: "hero-mascot--tr hero-mascot--delay-1",
    delay: "hero-mascot--delay-1",
    floatDelay: "0.5s",
    size: 118,
  },
  {
    id: "poppy-panda",
    pose: "hug" as const,
    position: "hero-mascot--br hero-mascot--delay-2",
    delay: "hero-mascot--delay-2",
    floatDelay: "1s",
    size: 101,
  },
] as const;

const mascotImageStyle = {
  background: "transparent",
  mixBlendMode: "multiply" as const,
  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))",
};

type HeroVisualProps = {
  heroImageUrl?: string | null;
  heroImageAlt: string;
};

/** Editorial hero focal with mascot accents layered above the image. */
export default function HeroVisual({ heroImageUrl, heroImageAlt }: HeroVisualProps) {
  const resolved = resolveVisualUrl(heroImageUrl, { category: "hero", slug: "gentle-care-hero" });
  const resolvedUrl = resolved.url || HERO_DEFAULT_IMAGE;
  const heroBlur = resolveImageBlur(heroImageUrl ? resolved.blur : HERO_DEFAULT_BLUR);

  return (
    <div className="hero-visual-stage hero-editorial relative mx-auto w-full max-w-[32rem] lg:max-w-[34rem]">
      <div className="premium-image-frame hero-editorial-frame relative z-0 aspect-[4/5] w-full overflow-hidden bg-white">
        <Image
          src={resolvedUrl}
          alt={heroImageAlt}
          fill
          priority={true}
          sizes={IMAGE_SIZES.hero}
          quality={IMAGE_QUALITY.hero}
          placeholder="blur"
          blurDataURL={heroBlur}
          className="hero-editorial-image absolute inset-0 z-0 object-cover object-[center_22%]"
        />
      </div>

      <div aria-hidden="true" className="hero-editorial-reflection relative z-0" />
      <div aria-hidden="true" className="hero-editorial-pedestal relative z-0" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 select-none"
      >
        {HERO_MASCOTS.map((mascot) => (
          <div
            key={mascot.id}
            className={cn("hero-mascot absolute z-30 animate-float", mascot.position, mascot.delay)}
            style={{ animationDelay: mascot.floatDelay }}
          >
            <Image
              src={resolveMascotAssetSrc(mascot.id, mascot.pose)}
              alt=""
              width={mascot.size}
              height={mascot.size}
              loading="lazy"
              draggable={false}
              sizes={fixedImageSizes(mascot.size)}
              quality={IMAGE_QUALITY.mascot}
              className="relative z-20 object-contain drop-shadow-2xl"
              style={mascotImageStyle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
