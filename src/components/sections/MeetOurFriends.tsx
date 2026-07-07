"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { MASCOTS } from "@/lib/brand/copy";
import type { MascotsConfig } from "@/lib/admin/homepage-schema";
import { IMAGE_DIMENSIONS, IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";

const HOMEPAGE_MASCOTS = [
  {
    slug: "bella",
    name: "Bella Bunny",
    role: "Comfort & Care",
    color: "#FFB6C1",
    img: "/icons/bella-bunny/default.webp",
    waveImg: "/icons/bella-bunny/wave.webp",
  },
  {
    slug: "eli",
    name: "Eli Elephant",
    role: "Safety & Research",
    color: "#87CEEB",
    img: "/icons/eli-elephant/default.webp",
    waveImg: "/icons/eli-elephant/wave.webp",
  },
  {
    slug: "gigi",
    name: "Gigi Giraffe",
    role: "Learning & Growth",
    color: "#FFD700",
    img: "/icons/gigi-giraffe/default.webp",
    waveImg: "/icons/gigi-giraffe/wave.webp",
  },
  {
    slug: "poppy",
    name: "Poppy Panda",
    role: "Gentleness & Calm",
    color: "#98FB98",
    img: "/icons/poppy-panda/default.webp",
    waveImg: "/icons/poppy-panda/wave.webp",
  },
  {
    slug: "penny",
    name: "Penny Penguin",
    role: "Product Discovery",
    color: "#DDA0DD",
    img: "/icons/penny-penguin/default.webp",
    waveImg: "/icons/penny-penguin/wave.webp",
  },
  {
    slug: "benny",
    name: "Benny Bear",
    role: "Everyday Joy",
    color: "#F4A460",
    img: "/icons/benny-bear/default.webp",
    waveImg: "/icons/benny-bear/wave.webp",
  },
] as const;

type MascotCardData = (typeof HOMEPAGE_MASCOTS)[number];

function MascotCard({ mascot, delay }: { mascot: MascotCardData; delay: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/mascots/${mascot.slug}`}
      className="group flex min-h-[11rem] cursor-pointer flex-col items-center text-center sm:min-h-[12rem] md:min-h-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={
          "relative mb-3 h-40 min-h-40 w-40 min-w-40 transition-all duration-300 " +
          (hovered ? "scale-110 -translate-y-2" : "")
        }
        style={{ animationDelay: `${delay}s` }}
      >
        <Image
          src={hovered ? mascot.waveImg : mascot.img}
          alt={mascot.name}
          width={IMAGE_DIMENSIONS.mascotGrid.width}
          height={IMAGE_DIMENSIONS.mascotGrid.height}
          sizes={IMAGE_SIZES.mascotGrid}
          quality={IMAGE_QUALITY.mascot}
          className="relative z-30 h-full w-full object-contain drop-shadow-2xl"
          style={{ background: "transparent" }}
        />
      </div>
      <h3 className="text-base font-bold text-[#2d5a27]">{mascot.name}</h3>
      <p className="mt-1 text-xs text-gray-400">{mascot.role}</p>
      <div className="mt-2 h-1 w-8 rounded-full" style={{ backgroundColor: mascot.color }} />
    </Link>
  );
}

export default function MeetOurFriends({ config }: { config?: MascotsConfig }) {
  const heading = config?.heading?.trim() || "Your Baby's Best Friends 🐾";

  return (
    <section
      id="mascots"
      className="relative overflow-visible bg-gradient-to-b from-[#faf5f0] to-[#f0f7ee] py-20"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-[#c4673a]">
            {MASCOTS.eyebrow}
          </span>
          <h2 className="mb-4 mt-3 text-5xl font-black text-[#2d5a27]">{heading}</h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-500">
            Each mascot represents a promise we make to every little one
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8 lg:grid-cols-6">
          {HOMEPAGE_MASCOTS.map((mascot, index) => (
            <MascotCard key={mascot.slug} mascot={mascot} delay={index * 0.15} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/mascots"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#2d5a27] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a3a16]"
          >
            Meet the whole family →
          </Link>
        </div>
      </div>
    </section>
  );
}
