"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { MascotContent } from "@/lib/mascots/content";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";

type MascotHubCardProps = {
  slug: string;
  mascot: MascotContent;
  delay: number;
};

export default function MascotHubCard({ slug, mascot, delay }: MascotHubCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/mascots/${slug}`}
      className="group flex flex-col items-center rounded-3xl border border-white/80 bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:bg-white hover:shadow-xl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative mb-4 h-40 w-40 transition-transform duration-300 group-hover:scale-110"
        style={{ animationDelay: `${delay}s` }}
      >
        <Image
          src={hovered ? mascot.celebrationImg : mascot.image}
          alt={mascot.name}
          fill
          sizes={IMAGE_SIZES.mascot}
          quality={IMAGE_QUALITY.mascot}
          className="animate-float object-contain drop-shadow-2xl"
        />
      </div>

      <h2 className="text-xl font-bold text-[#2d5a27]">{mascot.name}</h2>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#c4673a]">
        {mascot.personality}
      </p>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-500">{mascot.tagline}</p>
      <div className="mt-4 h-1 w-10 rounded-full" style={{ backgroundColor: mascot.color }} />
      <span className="mt-4 text-sm font-semibold text-[#2d5a27] opacity-0 transition-opacity group-hover:opacity-100">
        Meet {mascot.name.split(" ")[0]} →
      </span>
    </Link>
  );
}
