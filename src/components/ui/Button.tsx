"use client";

import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { focusRing, motionButton } from "@/lib/design/ui";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "cta";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  asChild?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary-premium",
  secondary: "btn-secondary-premium",
  ghost: "btn-ghost-premium",
  outline: "btn-secondary-premium bg-transparent",
  cta: "bg-terra-500 text-white border border-transparent shadow-soft hover:bg-terra-600",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-11 min-h-[2.75rem] px-4 text-sm",
  md: "h-12 min-h-[3rem] px-6 text-base",
  lg: "h-[3.25rem] min-h-[3.25rem] px-8 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    children,
    className,
    disabled = false,
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    type = "button",
    asChild = false,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const Comp = asChild ? Slot : "button";

  const content = (
    <>
      {loading ? (
        <span aria-hidden="true" className="spinner-premium" />
      ) : (
        leftIcon && (
          <span
            aria-hidden="true"
            className="inline-flex shrink-0 [&_svg]:h-[1.125rem] [&_svg]:w-[1.125rem]"
          >
            {leftIcon}
          </span>
        )
      )}
      <span>{children}</span>
      {!loading && rightIcon && (
        <span
          aria-hidden="true"
          className="inline-flex shrink-0 [&_svg]:h-[1.125rem] [&_svg]:w-[1.125rem]"
        >
          {rightIcon}
        </span>
      )}
    </>
  );

  return (
    <Comp
      ref={ref}
      {...(!asChild ? { type, disabled: isDisabled } : {})}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full font-body font-semibold",
        motionButton,
        focusRing,
        "disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-55 disabled:shadow-none disabled:transform-none",
        "whitespace-nowrap select-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {asChild ? children : content}
    </Comp>
  );
});

export default Button;
