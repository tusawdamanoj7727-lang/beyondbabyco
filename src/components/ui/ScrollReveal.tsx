import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms for grid items */
  delayMs?: number;
  as?: "div" | "section" | "article";
};

/** CSS view-timeline reveal — no Framer Motion, no hydration cost. */
export default function ScrollReveal({
  children,
  className,
  delayMs = 0,
  as: Tag = "div",
}: ScrollRevealProps) {
  const style =
    delayMs > 0
      ? ({ animationDelay: `${delayMs}ms` } as CSSProperties)
      : undefined;

  return (
    <Tag className={cn("scroll-reveal-item", className)} style={style}>
      {children}
    </Tag>
  );
}
