import Image from "next/image";

import { IMAGES } from "@/lib/images";
import { HERO_DEFAULT_BLUR } from "@/lib/homepage/visual-assets";
import { resolveVisualUrl } from "@/lib/brand/generated-assets";
import { IMAGE_DIMENSIONS, IMAGE_QUALITY, IMAGE_SIZES, mascotImageQuality, resolveImageBlur } from "@/lib/media/image-delivery";
import { resolveMascotAssetSrc } from "@/lib/mascots";
import type { MascotPose, MascotType } from "@/components/mascots/Mascot";
import { cn } from "@/lib/utils";

const MASCOT_IMAGE_STYLE = {
  background: "transparent",
  filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.12))",
} as const;

const HERO_MASCOTS: {
  id: MascotType;
  pose: MascotPose;
  position: string;
  animationDelay: string;
}[] = [
  {
    id: "bella-bunny",
    pose: "wave",
    position: "hero-mascot--tl",
    animationDelay: "0s",
  },
  {
    id: "gigi-giraffe",
    pose: "welcome",
    position: "hero-mascot--tr",
    animationDelay: "0.5s",
  },
  {
    id: "poppy-panda",
    pose: "hug",
    position: "hero-mascot--br",
    animationDelay: "1s",
  },
] as const;

type HeroVisualProps = {
  heroImageUrl?: string | null;
  heroImageAlt: string;
};

/** Editorial hero focal with mascot accents layered above the image. */
export default function HeroVisual({ heroImageUrl, heroImageAlt }: HeroVisualProps) {
  const resolved = resolveVisualUrl(heroImageUrl, { category: "hero", slug: "gentle-care-hero" });
  const resolvedUrl = resolved.url || IMAGES.hero.mother_baby;
  const heroBlur = resolveImageBlur(heroImageUrl ? resolved.blur : HERO_DEFAULT_BLUR);

  return (
    <div className="hero-visual-stage relative z-10 mx-auto w-full max-w-[32rem] overflow-visible lg:max-w-[34rem]">
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
          className="absolute inset-0 z-0 object-cover object-[center_22%]"
        />
      </div>

      <div aria-hidden="true" className="hero-editorial-reflection relative z-0" />
      <div aria-hidden="true" className="hero-editorial-pedestal relative z-0" />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 select-none">
        {HERO_MASCOTS.map((mascot) => (
          <div
            key={mascot.id}
            className={cn("hero-mascot absolute z-30 pointer-events-none select-none", mascot.position)}
          >
            <Image
              src={resolveMascotAssetSrc(mascot.id, mascot.pose)}
              alt=""
              width={IMAGE_DIMENSIONS.mascotHero.width}
              height={IMAGE_DIMENSIONS.mascotHero.height}
              loading="lazy"
              draggable={false}
              sizes={IMAGE_SIZES.mascotHero}
              quality={mascotImageQuality(IMAGE_DIMENSIONS.mascotHero.width)}
              className="object-contain drop-shadow-2xl animate-float"
              style={{ ...MASCOT_IMAGE_STYLE, animationDelay: mascot.animationDelay }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
