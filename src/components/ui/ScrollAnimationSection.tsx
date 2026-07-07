"use client";

import type { ReactNode } from "react";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

type ScrollAnimationSectionProps = {
  children: ReactNode;
  className?: string;
  animationClass?: string;
};

export default function ScrollAnimationSection({
  children,
  className,
  animationClass = "animate-fade-up",
}: ScrollAnimationSectionProps) {
  const ref = useScrollAnimation(animationClass);

  return (
    <div ref={ref} className={cn("opacity-0", className)}>
      {children}
    </div>
  );
}
