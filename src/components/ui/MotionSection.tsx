"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

import {
  fadeUp,
  scaleIn,
  slideLeft,
  slideRight,
  viewportConfig,
} from "../../lib/animations";
import { cn } from "../../lib/utils";

type MotionSectionVariant = "fadeUp" | "slideLeft" | "slideRight" | "scaleIn";
type MotionSectionElement = "section" | "div" | "article";

const motionElements = {
  section: motion.section,
  div: motion.div,
  article: motion.article,
} as const;

const variantMap: Record<MotionSectionVariant, Variants> = {
  fadeUp,
  slideLeft,
  slideRight,
  scaleIn,
};

// React's drag/animation handler types conflict with Framer Motion's.
type MotionConflictingHandlers =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration";

export type MotionSectionProps = Omit<
  HTMLAttributes<HTMLElement>,
  MotionConflictingHandlers
> & {
  children: ReactNode;
  variant?: MotionSectionVariant;
  delay?: number;
  className?: string;
  as?: MotionSectionElement;
  viewport?: boolean;
  once?: boolean;
};

function withDelay(baseVariant: Variants, delay: number): Variants {
  const showState = baseVariant.show;

  if (!showState || typeof showState !== "object") {
    return baseVariant;
  }

  const showObject = showState as Record<string, unknown>;
  const existingTransition =
    showObject.transition && typeof showObject.transition === "object"
      ? (showObject.transition as Record<string, unknown>)
      : {};

  return {
    ...baseVariant,
    show: {
      ...showObject,
      transition: {
        ...existingTransition,
        delay,
      },
    },
  };
}

const MotionSection = forwardRef<HTMLElement, MotionSectionProps>(function MotionSection(
  {
    children,
    variant = "fadeUp",
    delay = 0,
    className,
    as = "section",
    viewport = true,
    once = true,
    ...rest
  },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const MotionElement = motionElements[as];
  const selectedVariant = withDelay(variantMap[variant], delay);

  if (reduceMotion) {
    const StaticElement = as;
    return (
      <StaticElement ref={ref as never} className={cn(className)} {...rest}>
        {children}
      </StaticElement>
    );
  }

  return (
    <MotionElement
      ref={ref as never}
      variants={selectedVariant}
      initial="hidden"
      animate={!viewport ? "show" : undefined}
      whileInView={viewport ? "show" : undefined}
      viewport={viewport ? { ...viewportConfig, once } : undefined}
      className={cn(className)}
      {...rest}
    >
      {children}
    </MotionElement>
  );
});

export default MotionSection;
