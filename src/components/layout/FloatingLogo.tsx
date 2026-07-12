"use client";

import Link from "next/link";

import StaticSvgImage from "@/components/media/StaticSvgImage";

/** Presentational floating brand medallion — additive home link only. */
export default function FloatingLogo() {
  return (
    <Link
      href="/"
      aria-label="BeyondBabyCo home"
      className="floating-logo"
    >
      <span className="floating-logo__disc" aria-hidden="true">
        <StaticSvgImage
          src="/images/brand/logo.svg"
          alt=""
          width={44}
          height={44}
          loading="eager"
          className="floating-logo__img"
        />
      </span>
    </Link>
  );
}
