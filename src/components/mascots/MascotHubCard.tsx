"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { MascotContent } from "@/lib/mascots/content";
import { IMAGE_DIMENSIONS, fixedImageSizes, mascotImageQuality } from "@/lib/media/image-delivery";

type MascotHubCardProps = {
  slug: string;
  mascot: MascotContent;
  delay: number;
};

function waveImageFromDefault(image: string): string {
  return image.replace(/\/default\.webp$/, "/wave.webp");
}

export default function MascotHubCard({ slug, mascot, delay }: MascotHubCardProps) {
  const [hovered, setHovered] = useState(false);
  const waveImg = waveImageFromDefault(mascot.image);

  return (
    <Link
      href={`/mascots/${slug}`}
      className="group flex flex-col items-center rounded-3xl border border-white/80 bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:bg-white hover:shadow-xl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={
          "relative mb-4 h-40 min-h-40 w-40 min-w-40 transition-all duration-300 " +
          (hovered ? "scale-110 -translate-y-2" : "")
        }
        style={{ animationDelay: `${delay}s` }}
      >
        <Image
          src={hovered ? waveImg : mascot.image}
          alt={mascot.name}
          width={IMAGE_DIMENSIONS.mascotGrid.width}
          height={IMAGE_DIMENSIONS.mascotGrid.height}
          loading="lazy"
          sizes={fixedImageSizes(160)}
          quality={mascotImageQuality(160)}
          className="relative z-30 h-full w-full object-contain drop-shadow-2xl"
          style={{ background: "transparent" }}
        />
      </div>

      <h2 className="text-xl font-bold text-brand-forest">{mascot.name}</h2>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-brand-terra">
        {mascot.personality}
      </p>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-500">{mascot.tagline}</p>
      <div className="mt-4 h-1 w-10 rounded-full" style={{ backgroundColor: mascot.color }} />
      <span className="mt-4 text-sm font-semibold text-brand-forest opacity-0 transition-opacity group-hover:opacity-100">
        Meet {mascot.name.split(" ")[0]} →
      </span>
    </Link>
  );
}
