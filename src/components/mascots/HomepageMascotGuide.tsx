"use client";

import Mascot, { type MascotPose, type MascotType } from "./Mascot";
import { mascotFloatDuration, mascotLabel } from "@/lib/mascots";
import { cn } from "@/lib/utils";

type HomepageMascotGuideProps = {
  mascot: MascotType;
  pose: MascotPose;
  size?: number;
  /** Positioning classes on the absolute wrapper (parent must be `relative`). */
  placementClassName?: string;
  className?: string;
  bounce?: boolean;
  floating?: boolean;
};

/** Decorative homepage mascot accent — uses `/icons/{mascot}/{pose}.webp` asset resolution. */
export default function HomepageMascotGuide({
  mascot,
  pose,
  size = 180,
  placementClassName,
  className,
  bounce = false,
  floating = true,
}: HomepageMascotGuideProps) {
  const shortName = mascotLabel(mascot).split(" ")[0] ?? mascotLabel(mascot);

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-30 hidden select-none lg:block",
        placementClassName,
        bounce && "animate-bounce",
      )}
      style={bounce ? { animationDuration: "3s" } : undefined}
      aria-hidden="true"
    >
      <Mascot
        mascot={mascot}
        pose={pose}
        size={size}
        animated
        floating={floating}
        interactive
        duration={mascotFloatDuration(mascot)}
        alt={`${shortName} guide`}
        className={cn("relative z-30", className)}
      />
    </div>
  );
}
