"use client";

import { forwardRef, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";

import { fadeUp, viewportConfig } from "../../lib/animations";
import { focusRing, motionCard, surfaceGlass } from "@/lib/design/ui";
import { cn } from "../../lib/utils";

type CardVariant = "default" | "elevated" | "outline" | "glass" | "feature";
type CardPadding = "none" | "sm" | "md" | "lg";
type CardRadius = "card" | "lg" | "3xl" | "4xl";
type CardAs = "article" | "section" | "div" | "aside";

const motionElements = {
  article: motion.article,
  section: motion.section,
  div: motion.div,
  aside: motion.aside,
} as const;

type MotionConflictingHandlers =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration";

export type CardProps = Omit<
  HTMLAttributes<HTMLElement>,
  MotionConflictingHandlers
> & {
  as?: CardAs;
  variant?: CardVariant;
  padding?: CardPadding;
  radius?: CardRadius;
  hover?: boolean;
  animated?: boolean;
  fullHeight?: boolean;
  children: ReactNode;
  className?: string;
};

const variantClasses: Record<CardVariant, string> = {
  default: "premium-card",
  elevated: cn("premium-card", "border-transparent"),
  outline: "bg-transparent border border-green-500/40 shadow-none rounded-[var(--radius-card)]",
  glass: cn(surfaceGlass, "rounded-[var(--radius-card)]"),
  feature: "premium-card bg-cream-100 border-green-500/35",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const radiusClasses: Record<CardRadius, string> = {
  card: "rounded-[var(--radius-card)]",
  lg: "rounded-[var(--radius-card)]",
  "3xl": "rounded-[var(--radius-card)]",
  "4xl": "rounded-[var(--radius-4xl)]",
};

const Card = forwardRef<HTMLElement, CardProps>(function Card(
  {
    as = "article",
    variant = "default",
    padding = "md",
    radius = "card",
    hover = false,
    animated = false,
    fullHeight = false,
    children,
    className,
    ...rest
  },
  ref,
) {
  const classNames = cn(
    "relative",
    focusRing,
    motionCard,
    hover && "interactive-lift",
    variantClasses[variant],
    paddingClasses[padding],
    variant !== "outline" && variant !== "glass" && variant !== "feature" && radiusClasses[radius],
    fullHeight && "h-full",
    className,
  );

  if (!animated) {
    const StaticTag = as as ElementType;
    return (
      <StaticTag ref={ref as never} className={classNames} {...rest}>
        {children}
      </StaticTag>
    );
  }

  const MotionComponent = motionElements[as];

  return (
    <MotionComponent
      ref={ref as never}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={viewportConfig}
      className={classNames}
      {...rest}
    >
      {children}
    </MotionComponent>
  );
});

export default Card;
