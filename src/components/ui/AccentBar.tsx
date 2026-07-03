import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AccentBarWidth = "sm" | "md" | "lg";
type AccentBarAlign = "left" | "center" | "right";

export type AccentBarProps = HTMLAttributes<HTMLDivElement> & {
  width?: AccentBarWidth;
  align?: AccentBarAlign;
  animated?: boolean;
  className?: string;
};

const widthClasses: Record<AccentBarWidth, string> = {
  sm: "w-9",
  md: "w-[60px]",
  lg: "w-24",
};

const alignClasses: Record<AccentBarAlign, string> = {
  left: "mr-auto",
  center: "mx-auto",
  right: "ml-auto",
};

const AccentBar = forwardRef<HTMLDivElement, AccentBarProps>(function AccentBar(
  { width = "md", align = "left", animated = true, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-align={align}
      className={cn(
        "h-[3.5px] rounded-full bg-terra-600",
        widthClasses[width],
        alignClasses[align],
        animated && "accent-bar-animated",
        className,
      )}
      {...rest}
    />
  );
});

export default AccentBar;
