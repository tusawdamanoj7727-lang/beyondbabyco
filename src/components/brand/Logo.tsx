import Image from "next/image";
import Link from "next/link";

import {
  BRAND_LOGO_ALT,
  brandLogoDimensions,
  brandLogoPath,
  type BrandLogoVariant,
} from "@/lib/brand/logo";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string | null;
  size?: "nav" | "md" | "footer" | "loading";
  variant?: BrandLogoVariant;
  priority?: boolean;
};

/** Height-only sizing (+35% vs Phase 10.7) — width follows intrinsic aspect ratio. */
const sizeMap = {
  /** Navbar: 110px mobile, 140px desktop width */
  nav: {
    className: "h-auto w-[110px] lg:w-[140px]",
    sizes: "(max-width: 1024px) 110px, 140px",
  },
  /** Auth, checkout, admin login */
  md: {
    className: "h-[3.75rem] w-auto sm:h-16",
    sizes: "65px",
  },
  /** Footer on dark green */
  footer: {
    className: "h-16 w-auto sm:h-[4.375rem]",
    sizes: "70px",
  },
  /** Full-page loading states */
  loading: {
    className: "h-16 w-auto sm:h-20",
    sizes: "80px",
  },
} as const;

export default function Logo({
  className,
  href = "/",
  size = "md",
  variant,
  priority = size === "nav",
}: LogoProps) {
  const resolvedVariant = variant ?? "default";
  const dims = sizeMap[size];
  const { width, height } = brandLogoDimensions(resolvedVariant);
  const src = brandLogoPath(resolvedVariant);

  const image = (
    <Image
      src={src}
      alt={BRAND_LOGO_ALT}
      width={width}
      height={height}
      priority={priority}
      sizes={dims.sizes}
      unoptimized={src.endsWith(".png")}
      className={cn(dims.className, "object-contain object-left", className)}
    />
  );

  if (href === null || href === undefined) return image;

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center rounded-lg transition-opacity duration-[var(--duration-button)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50"
      aria-label="BeyondBabyCo home"
    >
      {image}
    </Link>
  );
}
