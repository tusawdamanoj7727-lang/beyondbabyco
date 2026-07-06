import { forwardRef, type ElementType, type HTMLAttributes, type ReactNode } from "react";

import { focusRing, motionCard, surfaceGlass } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "elevated" | "outline" | "glass" | "feature";
type CardPadding = "none" | "sm" | "md" | "lg";
type CardRadius = "card" | "lg" | "3xl" | "4xl";
type CardAs = "article" | "section" | "div" | "aside";

export type CardProps = HTMLAttributes<HTMLElement> & {
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
  const Tag = as as ElementType;
  const classNames = cn(
    "relative",
    focusRing,
    motionCard,
    hover && "interactive-lift",
    animated && "scroll-reveal-item",
    variantClasses[variant],
    paddingClasses[padding],
    variant !== "outline" && variant !== "glass" && variant !== "feature" && radiusClasses[radius],
    fullHeight && "h-full",
    className,
  );

  return (
    <Tag ref={ref as never} className={classNames} {...rest}>
      {children}
    </Tag>
  );
});

export default Card;
