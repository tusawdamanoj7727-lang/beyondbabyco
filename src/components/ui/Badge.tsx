"use client";

import {
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  forwardRef,
} from "react";

import { focusRing } from "@/lib/design/ui";
import { cn } from "../../lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "info" | "comingSoon";
type BadgeSize = "sm" | "md" | "lg";
type BadgeRounded = "full" | "pill";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: BadgeRounded;
  icon?: ReactNode;
  animated?: boolean;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-cream-100 text-green-700 border border-cream-300",
  success: "bg-green-100 text-green-800 border border-green-200",
  warning: "bg-terra-100 text-terra-700 border border-terra-200",
  info: "bg-cream-50 text-green-700 border border-cream-200",
  comingSoon:
    "bg-terra-500 text-white border border-terra-600 uppercase tracking-[0.12em] font-heading animate-[pulseSoft_2.4s_ease-in-out_infinite]",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "h-6 px-2.5 text-xs",
  md: "h-7 px-3 text-sm",
  lg: "h-8 px-3.5 text-sm",
};

const roundedClasses: Record<BadgeRounded, string> = {
  full: "rounded-full",
  pill: "rounded-4xl",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    variant = "default",
    size = "md",
    rounded = "full",
    icon,
    children,
    className,
    role,
    tabIndex,
    onClick,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const isInteractive = typeof onClick === "function" || role === "button";

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (!isInteractive) {
      onKeyDown?.(event);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.(event as unknown as React.MouseEvent<HTMLSpanElement>);
    }

    onKeyDown?.(event);
  };

  return (
    <span
      ref={ref}
      role={role}
      tabIndex={tabIndex ?? (isInteractive ? 0 : undefined)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex items-center justify-center gap-1.5",
        "font-body font-medium leading-none whitespace-nowrap select-none",
        focusRing,
        "transition-colors duration-[var(--duration-button)] ease-[var(--ease-out)]",
        isInteractive && "cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        roundedClasses[rounded],
        className,
      )}
      {...rest}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
});

export default Badge;
