"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";

import {
  fadeUp,
  scaleIn,
  slideLeft,
  slideRight,
  viewportConfig,
} from "../../lib/animations";
import { cn } from "../../lib/utils";
import MotionSection from "./MotionSection";

type RevealVariant = "fadeUp" | "slideLeft" | "slideRight" | "scaleIn";
type RevealElement = "div" | "span";

const inlineVariantMap: Record<RevealVariant, Variants> = {
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

export type RevealProps = Omit<
  HTMLAttributes<HTMLElement>,
  MotionConflictingHandlers
> & {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  as?: RevealElement;
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

const Reveal = forwardRef<HTMLElement, RevealProps>(function Reveal(
  {
    children,
    variant = "fadeUp",
    delay = 0,
    className,
    as = "div",
    viewport = true,
    once = true,
    ...rest
  },
  ref,
) {
  // Block-level reveals reuse MotionSection's animation system directly.
  if (as === "div") {
    return (
      <MotionSection
        ref={ref}
        as="div"
        variant={variant}
        delay={delay}
        viewport={viewport}
        once={once}
        className={className}
        {...rest}
      >
        {children}
      </MotionSection>
    );
  }

  // Inline reveals need a <span>, which MotionSection does not render,
  // so reuse the same shared variants instead of duplicating timing logic.
  const selectedVariant = withDelay(inlineVariantMap[variant], delay);

  return (
    <motion.span
      ref={ref as never}
      variants={selectedVariant}
      initial="hidden"
      animate={!viewport ? "show" : undefined}
      whileInView={viewport ? "show" : undefined}
      viewport={viewport ? { ...viewportConfig, once } : undefined}
      className={cn("inline-block", className)}
      {...rest}
    >
      {children}
    </motion.span>
  );
});

export default Reveal;
