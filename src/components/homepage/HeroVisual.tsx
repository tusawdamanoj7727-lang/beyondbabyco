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
  size: number;
}[] = [
  {
    id: "bella-bunny",
    pose: "wave" as const,
    position: "hero-mascot--tl",
    delay: "",
    size: 76,
  },
  {
    id: "gigi-giraffe",
    pose: "welcome" as const,
    position: "hero-mascot--tr hero-mascot--delay-1",
    delay: "hero-mascot--delay-1",
    size: 84,
  },
  {
    id: "poppy-panda",
    pose: "hug" as const,
    position: "hero-mascot--br hero-mascot--delay-2",
    delay: "hero-mascot--delay-2",
    size: 72,
  },
] as const;

type HeroVisualProps = {
  heroImageUrl?: string | null;
  heroImageAlt: string;
};

/** Editorial hero focal with subtle mascot accents — CSS-only float, no competing overlays. */
export default function HeroVisual({ heroImageUrl, heroImageAlt }: HeroVisualProps) {
  const resolved = resolveVisualUrl(heroImageUrl, { category: "hero", slug: "gentle-care-hero" });
  const resolvedUrl = resolved.url || HERO_DEFAULT_IMAGE;
  const heroBlur = resolveImageBlur(heroImageUrl ? resolved.blur : HERO_DEFAULT_BLUR);

  return (
    <div className="hero-visual-stage hero-editorial mx-auto w-full max-w-[32rem] lg:max-w-[34rem]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {HERO_MASCOTS.map((mascot) => (
          <div key={mascot.id} className={cn("hero-mascot", mascot.position, mascot.delay)}>
            <Image
              src={resolveMascotAssetSrc(mascot.id, mascot.pose)}
              alt=""
              width={mascot.size}
              height={mascot.size}
              loading="lazy"
              draggable={false}
              sizes={fixedImageSizes(mascot.size)}
              quality={IMAGE_QUALITY.mascot}
              className="pointer-events-none select-none object-contain"
            />
          </div>
        ))}
      </div>

      <div className="premium-image-frame hero-editorial-frame relative z-[1] aspect-[4/5] w-full overflow-hidden bg-white">
        <Image
          src={resolvedUrl}
          alt={heroImageAlt}
          fill
          priority={true}
          sizes={IMAGE_SIZES.hero}
          quality={IMAGE_QUALITY.hero}
          placeholder="blur"
          blurDataURL={heroBlur}
          className="hero-editorial-image object-cover object-[center_22%]"
        />
      </div>
      <div aria-hidden="true" className="hero-editorial-reflection" />
      <div aria-hidden="true" className="hero-editorial-pedestal" />
    </div>
  );
}
