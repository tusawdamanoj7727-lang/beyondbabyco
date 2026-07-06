import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { revealClassName, revealDelayStyle, type RevealVariant } from "@/lib/reveal-classes";
import { cn } from "@/lib/utils";

type MotionSectionElement = "section" | "div" | "article";

export type MotionSectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  as?: MotionSectionElement;
  viewport?: boolean;
  once?: boolean;
};

const MotionSection = forwardRef<HTMLElement, MotionSectionProps>(function MotionSection(
  {
    children,
    variant = "fadeUp",
    delay = 0,
    className,
    as = "section",
    viewport = true,
    ...rest
  },
  ref,
) {
  const Tag = as;
  return (
    <Tag
      ref={ref as never}
      className={cn(revealClassName(variant, viewport), className)}
      style={revealDelayStyle(delay)}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export default MotionSection;
