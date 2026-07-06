"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { Mascot } from "@/components/mascots";
import type { MascotType } from "@/components/mascots";
import { fixedImageSizes, IMAGE_QUALITY } from "@/lib/media/image-delivery";
import { cn } from "@/lib/utils";

function buildHeroFallbacks(heroImage: string, mascotId: MascotType): string[] {
  const wave = heroImage.replace("-09-celebration", "-08-wave");
  const defaultImg = heroImage.replace("-09-celebration", "-01-default");
  return [...new Set([heroImage, wave, defaultImg, `/icons/${mascotId}/celebration.webp`, `/icons/${mascotId}/wave.webp`])];
}

type MascotHeroImageProps = {
  heroImage: string;
  mascotId: MascotType;
  alt: string;
  size?: number;
  priority?: boolean;
  className?: string;
};

export default function MascotHeroImage({
  heroImage,
  mascotId,
  alt,
  size = 360,
  priority = false,
  className,
}: MascotHeroImageProps) {
  const candidates = useMemo(() => buildHeroFallbacks(heroImage, mascotId), [heroImage, mascotId]);
  const [index, setIndex] = useState(0);
  const src = candidates[index];
  const exhausted = !src || index >= candidates.length;

  if (exhausted) {
    return (
      <Mascot
        mascot={mascotId}
        pose="celebration"
        size={size}
        priority={priority}
        animated
        floating
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      sizes={size <= 160 ? fixedImageSizes(size) : "(max-width: 640px) 40vw, 20vw"}
      quality={IMAGE_QUALITY.mascot}
      draggable={false}
      onError={() => setIndex((i) => i + 1)}
      className={cn("pointer-events-none select-none object-contain drop-shadow-[0_16px_40px_rgba(29,69,45,0.18)]", className)}
      style={{ width: size, height: size }}
    />
  );
}
