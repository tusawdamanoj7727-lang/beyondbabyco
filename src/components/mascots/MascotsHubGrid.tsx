import Link from "next/link";

import { Mascot } from "@/components/mascots";
import Badge from "@/components/ui/Badge";
import { MASCOTS } from "@/lib/brand/copy";
import { mascotFloatDuration } from "@/lib/mascots";
import {
  getAllMascotProfiles,
  MASCOT_COLOR_STYLES,
  mascotPagePath,
} from "@/lib/mascots/profiles";
import { cn } from "@/lib/utils";

export default function MascotsHubGrid() {
  const mascots = getAllMascotProfiles();

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="default" size="md" className="mb-4">
            {MASCOTS.eyebrow}
          </Badge>
          <h1 className="font-heading text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-green-900">
            Meet the BeyondBabyCo family
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-green-700/90 md:text-lg">
            {MASCOTS.intro}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {mascots.map((mascot) => {
            const styles = MASCOT_COLOR_STYLES[mascot.color];
            return (
              <Link
                key={mascot.slug}
                href={mascotPagePath(mascot.slug)}
                className={cn(
                  "group flex h-full flex-col items-center rounded-[2rem] border p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500 lg:p-8",
                  styles.card,
                )}
              >
                <Mascot
                  mascot={mascot.mascotId}
                  pose={mascot.hubPose}
                  size={200}
                  animated
                  floating
                  interactive
                  duration={mascotFloatDuration(mascot.mascotId)}
                  alt={`${mascot.fullName} mascot`}
                  className="relative z-10"
                />

                <h2 className="mt-5 font-heading text-2xl font-bold text-green-900">{mascot.fullName}</h2>

                <span className={cn("mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide", styles.badge)}>
                  {mascot.personality}
                </span>

                <p className={cn("mt-2 text-sm font-medium", styles.accent)}>{mascot.categoryLabel}</p>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-green-700/85">{mascot.tagline}</p>

                <span className="mt-5 text-sm font-semibold text-terra-600 transition group-hover:underline">
                  Meet {mascot.fullName.split(" ")[0]} →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
