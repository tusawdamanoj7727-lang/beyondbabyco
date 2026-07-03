"use client";

import Mascot, { type MascotPose, type MascotType } from "./Mascot";
import { MASCOT_FLOAT_DURATIONS } from "../../lib/mascots";
import { cn } from "../../lib/utils";

type SectionMascotProps = {
  mascot: MascotType;
  pose?: MascotPose;
  size?: number;
  className?: string;
  delay?: number;
  /** Decorative mascots use empty alt inside aria-hidden wrappers. */
  decorative?: boolean;
};

export default function SectionMascot({
  mascot,
  pose = "default",
  size = 140,
  className,
  delay = 0,
  decorative = false,
}: SectionMascotProps) {
  return (
    <Mascot
      mascot={mascot}
      pose={pose}
      size={size}
      animated
      floating
      interactive
      duration={MASCOT_FLOAT_DURATIONS[mascot]}
      delay={delay}
      alt={decorative ? "" : undefined}
      className={cn("drop-shadow-[0_12px_32px_rgba(29,69,45,0.15)]", className)}
    />
  );
}
