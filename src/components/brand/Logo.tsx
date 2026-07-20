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
  size?: "nav" | "md" | "footer" | "loading" | "hero";
  variant?: BrandLogoVariant;
  priority?: boolean;
};

/**
 * Cropped landscape lockup (717×348) — height-based so headers stay balanced
 * while the full “Beyond / Baby Co.” wordmark stays sharp and readable.
 */
const sizeMap = {
  /** Header / sticky / mobile drawer — locked to `--header-nav` breakpoints (768px) */
  nav: {
    className: "h-10 w-auto md:h-12",
    sizes: "(max-width: 767px) 118px, 148px",
  },
  /** Homepage hero brand signal */
  hero: {
    className: "h-14 w-auto sm:h-16 lg:h-[4.25rem]",
    sizes: "(max-width: 640px) 160px, (max-width: 1024px) 185px, 210px",
  },
  /** Auth, checkout empty, admin login */
  md: {
    className: "h-14 w-auto sm:h-16",
    sizes: "(max-width: 640px) 160px, 185px",
  },
  /** Footer brand block */
  footer: {
    className: "h-12 w-auto sm:h-14",
    sizes: "(max-width: 640px) 140px, 160px",
  },
  /** Full-page loading states */
  loading: {
    className: "h-16 w-auto sm:h-[4.5rem]",
    sizes: "(max-width: 640px) 185px, 210px",
  },
} as const;

export default function Logo({
  className,
  href = "/",
  size = "md",
  variant,
  priority = size === "hero",
}: LogoProps) {
  const resolvedVariant = variant ?? "default";
  const dims = sizeMap[size];
  const intrinsic = brandLogoDimensions(resolvedVariant);
  const src = brandLogoPath(resolvedVariant);

  const image = (
    <Image
      src={src}
      alt={BRAND_LOGO_ALT}
      width={intrinsic.width}
      height={intrinsic.height}
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
