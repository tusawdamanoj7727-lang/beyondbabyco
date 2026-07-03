"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import Logo from "@/components/brand/Logo";
import { Mascot } from "@/components/mascots";
import { HERO_DEFAULT_BLUR, HERO_DEFAULT_IMAGE } from "@/lib/homepage/visual-assets";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import { surfaceGlassStrong } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  mascotPose?: "welcome" | "wave" | "hug" | "hold-heart";
  title: string;
  subtitle: string;
  footer?: ReactNode;
};

export default function AuthShell({
  children,
  mascotPose = "welcome",
  title,
  subtitle,
  footer,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] w-full overflow-hidden bg-cream-50">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_12%_0%,color-mix(in_srgb,var(--green-200)_42%,transparent),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_88%_100%,color-mix(in_srgb,var(--terra-200)_28%,transparent),transparent_72%)]" />
        <div className="homepage-grain absolute inset-0 opacity-[0.035]" />
      </div>

      <div className="relative hidden w-[42%] max-w-xl shrink-0 overflow-hidden lg:block">
        <Image
          src={HERO_DEFAULT_IMAGE}
          alt=""
          fill
          priority
          sizes="42vw"
          placeholder="blur"
          blurDataURL={resolveImageBlur(HERO_DEFAULT_BLUR)}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/20 via-green-900/10 to-cream-50/95" />
        <div className="absolute bottom-10 left-10 right-10 text-cream-50">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cream-100/90">BeyondBabyCo</p>
          <p className="mt-2 font-heading text-2xl font-bold leading-tight">
            Every baby deserves the safest touch.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-1 items-center justify-center px-4 py-12 pb-[max(3rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center lg:justify-start">
            <Logo size="md" priority />
          </div>

          <div className={cn(surfaceGlassStrong, "auth-panel-enter overflow-hidden rounded-4xl p-8 shadow-clay")}>
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <Mascot
                mascot="bella-bunny"
                pose={mascotPose}
                size={88}
                priority
                animated
                floating
                duration={5}
              />
              <h1 className="mt-4 font-heading text-2xl font-bold text-green-900">{title}</h1>
              <p className="mt-1 text-sm leading-relaxed text-green-700/70">{subtitle}</p>
            </div>

            <div className="mt-7">{children}</div>
          </div>

          {footer ? <div className="mt-5 text-center lg:text-left">{footer}</div> : null}

          <p className="mt-5 text-center text-xs text-green-700/60 lg:text-left">
            BeyondBabyCo, a unit of Tusawda Global Private Limited
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthTrustStrip() {
  const items = ["Dermatologically tested", "Made in India", "Cruelty free"];
  return (
    <ul className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start" aria-label="Trust guarantees">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-green-100 bg-white/80 px-3 py-1 text-[11px] font-semibold text-green-800"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function AuthFooterLink({
  prompt,
  href,
  label,
}: {
  prompt: string;
  href: string;
  label: string;
}) {
  return (
    <p className="text-sm text-green-700/70">
      {prompt}{" "}
      <Link
        href={href}
        className="font-semibold text-terra-600 transition-colors hover:text-terra-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/60 rounded"
      >
        {label}
      </Link>
    </p>
  );
}

export function AuthAlert({
  id,
  variant,
  message,
}: {
  id?: string;
  variant: "error" | "success";
  message: string;
}) {
  const styles =
    variant === "error"
      ? "border-terra-200 bg-terra-50 text-terra-700"
      : "border-green-200 bg-green-50 text-green-800";

  return (
    <div
      id={id}
      role={variant === "error" ? "alert" : "status"}
      className={cn("rounded-2xl border px-4 py-3 text-sm font-medium", styles)}
    >
      {message}
    </div>
  );
}

export const authInputClasses =
  "form-control h-12 rounded-3xl bg-cream-50/90 pl-11 pr-4 text-base backdrop-blur-sm";

export function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {off ? (
        <>
          <path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.7 2.7" />
          <path d="M6.6 6.6A13.3 13.3 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
          <path d="m2 2 20 20" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}
