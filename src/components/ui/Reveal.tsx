import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { revealClassName, revealDelayStyle, type RevealVariant } from "@/lib/reveal-classes";
import { cn } from "@/lib/utils";
import MotionSection from "./MotionSection";

type RevealElement = "div" | "span";

export type RevealProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  as?: RevealElement;
  viewport?: boolean;
  once?: boolean;
};

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

  return (
    <span
      ref={ref as never}
      className={cn("inline-block", revealClassName(variant, viewport), className)}
      style={revealDelayStyle(delay)}
      {...rest}
    >
      {children}
    </span>
  );
});

export default Reveal;
