import type { ReactNode } from "react";

import PremiumSectionBackdrop from "@/components/ui/PremiumSectionBackdrop";
import { cn } from "@/lib/utils";

type HomeSectionTone = "cream" | "white" | "green";

type HomeSectionProps = {
  id?: string;
  tone?: HomeSectionTone;
  children: ReactNode;
  className?: string;
  /** Smaller vertical padding for compact bands (stats, trust). */
  compact?: boolean;
  reveal?: boolean;
};

/** Homepage section shell — shared grid, rhythm, and backdrop. */
export default function HomeSection({
  id,
  tone = "cream",
  children,
  className,
  compact = false,
  reveal = true,
}: HomeSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "homepage-section relative overflow-hidden",
        compact ? "section-padding-sm" : "section-padding",
        reveal && "scroll-reveal",
        className,
      )}
      data-tone={tone}
    >
      <PremiumSectionBackdrop variant={tone} />
      <div className="container relative z-10 w-full">{children}</div>
    </section>
  );
}
