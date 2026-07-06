"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Mascot, type MascotType } from "../mascots";
import { mascotFloatDuration, mascotLabel } from "../../lib/mascots";
import { MASCOTS } from "@/lib/brand/copy";
import { MASCOT_PROFILES } from "@/lib/data";
import {
  getAllMascotProfiles,
  mascotPagePath,
  type MascotColor,
} from "@/lib/mascots/profiles";
import type { MascotsConfig } from "@/lib/admin/homepage-schema";
import { cn } from "@/lib/utils";

const MASCOT_DOT_COLORS: Record<MascotColor, string> = {
  green: "#2d5a27",
  terra: "#c4673a",
  cream: "#c4a574",
};

type MascotCard = {
  mascot: MascotType;
  name: string;
  personality: string;
  href: string;
  color: MascotColor;
};

function resolveMascotCards(config?: MascotsConfig): MascotCard[] {
  const cmsItems = config?.items?.filter((item) => item.visible !== false) ?? [];

  if (cmsItems.length === 0) {
    return getAllMascotProfiles().map((profile) => ({
      mascot: profile.mascotId,
      name: profile.fullName,
      personality: profile.personality,
      href: mascotPagePath(profile.slug),
      color: profile.color,
    }));
  }

  return cmsItems
    .map((item) => {
      const profile = MASCOT_PROFILES.find((p) => p.mascotId === item.mascot);
      if (!profile) return null;

      return {
        mascot: item.mascot,
        name: mascotLabel(item.mascot),
        personality: item.description?.trim() || profile.personality,
        href: mascotPagePath(profile.slug),
        color: profile.color,
      };
    })
    .filter((card): card is MascotCard => card !== null);
}

function renderHeading(text: string) {
  if (text.includes("\n")) {
    return text.split("\n").map((line, i, arr) => (
      <span key={`${line}-${i}`}>
        {line}
        {i < arr.length - 1 ? <br /> : null}
      </span>
    ));
  }
  return text;
}

export default function MeetOurFriends({ config }: { config?: MascotsConfig }) {
  const [hoveredMascot, setHoveredMascot] = useState<MascotType | null>(null);
  const cards = useMemo(() => resolveMascotCards(config), [config]);

  const eyebrow = MASCOTS.eyebrow;
  const heading = config?.heading?.trim() || "Your Baby's Best Friends 🐾";
  const intro =
    "Each mascot represents a promise we make to your little one";

  return (
    <section
      id="mascots"
      className="relative overflow-hidden bg-gradient-to-b from-[#faf5f0] to-[#f0f7ee] py-20"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-[#c4673a]">
            {eyebrow}
          </span>
          <h2
            className="mb-4 mt-3 text-4xl font-black text-[#2d5a27] sm:text-5xl font-[family-name:var(--font-montserrat)]"
          >
            {renderHeading(heading)}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 sm:text-xl">{intro}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {cards.map((card) => {
            const isHovered = hoveredMascot === card.mascot;

            return (
              <Link
                key={card.mascot}
                href={card.href}
                className="group flex cursor-pointer flex-col items-center rounded-2xl text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4673a] focus-visible:ring-offset-2"
                onMouseEnter={() => setHoveredMascot(card.mascot)}
                onMouseLeave={() => setHoveredMascot(null)}
                onFocus={() => setHoveredMascot(card.mascot)}
                onBlur={() => setHoveredMascot(null)}
              >
                <div
                  className={cn(
                    "relative mb-4 flex h-40 w-40 items-center justify-center transition-transform duration-300",
                    "group-hover:scale-110 group-hover:-translate-y-2",
                    isHovered && "-translate-y-2 scale-110",
                  )}
                >
                  <Mascot
                    mascot={card.mascot}
                    pose={isHovered ? "wave" : "default"}
                    size={160}
                    animated={isHovered}
                    floating={isHovered}
                    interactive
                    duration={mascotFloatDuration(card.mascot)}
                    alt={`${card.name} mascot`}
                    className="relative z-10"
                  />
                </div>

                <h3 className="text-lg font-bold text-[#2d5a27]">{card.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{card.personality}</p>
                <div
                  className="mt-3 h-1 w-8 rounded-full transition-all duration-300 group-hover:w-12"
                  style={{ backgroundColor: MASCOT_DOT_COLORS[card.color] }}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            🐾 Each mascot was designed with love by our team. They accompany your baby through
            every step of their skincare routine.
          </p>
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
