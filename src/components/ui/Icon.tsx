import type { LucideIcon, LucideProps } from "lucide-react";

import { cn } from "@/lib/utils";

export type IconSize = "sm" | "md" | "lg";

const sizeClasses: Record<IconSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export type IconProps = LucideProps & {
  icon: LucideIcon;
  size?: IconSize;
};

/**
 * Single outline icon family — Lucide with consistent stroke weight.
 */
export default function Icon({
  icon: LucideComponent,
  size = "md",
  className,
  strokeWidth = 1.75,
  ...props
}: IconProps) {
  return (
    <LucideComponent
      aria-hidden={props["aria-label"] ? undefined : true}
      strokeWidth={strokeWidth}
      className={cn("icon-outline shrink-0", sizeClasses[size], className)}
      {...props}
    />
  );
}
