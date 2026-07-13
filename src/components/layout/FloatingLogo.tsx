"use client";

import Link from "next/link";

import StaticSvgImage from "@/components/media/StaticSvgImage";
import { focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

/** Presentational floating brand medallion — additive home link only. */
export default function FloatingLogo() {
  return (
    <Link
      href="/"
      aria-label="BeyondBabyCo home"
      className={cn("floating-logo", focusRing)}
    >
      <span className="floating-logo__disc" aria-hidden="true">
        <StaticSvgImage
          src="/images/brand/logo.svg"
          alt=""
          width={36}
          height={36}
          loading="eager"
          className="floating-logo__img mx-auto"
        />
      </span>
    </Link>
  );
}
