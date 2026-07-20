"use client";

import Image from "next/image";

import type { CampaignCenterConfig } from "@/lib/campaigns/types";
import { HOMEPAGE_SLOT_LABELS } from "@/lib/campaigns/types";
import { cn } from "@/lib/utils";

export default function CampaignPreviewPanel({
  config,
  name,
  viewport = "desktop",
  couponLabel,
}: {
  config: CampaignCenterConfig;
  name: string;
  viewport?: "desktop" | "tablet" | "mobile";
  couponLabel?: string | null;
}) {
  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";
  const hero = config.assets.hero ?? config.assets.banner;
  const mobile = config.assets.mobileBanner ?? hero;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-card",
        isMobile ? "mx-auto max-w-[375px]" : isTablet ? "mx-auto max-w-[768px]" : "w-full",
      )}
      aria-label={`${viewport} campaign preview`}
    >
      <div
        className="relative px-6 py-10 text-white"
        style={{ background: `linear-gradient(135deg, ${config.theme.primary}, ${config.theme.background})` }}
      >
        {(isMobile ? mobile : hero) ? (
          <div className="absolute inset-0 opacity-30">
            <Image
              src={(isMobile ? mobile : hero) || ""}
              alt=""
              fill
              className="object-cover"
              sizes={isMobile ? "375px" : isTablet ? "768px" : "800px"}
            />
          </div>
        ) : null}
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{name}</p>
          <h2 className={cn("mt-2 font-heading font-extrabold", isMobile ? "text-2xl" : "text-3xl")}>
            {config.headline || "Campaign headline"}
          </h2>
          {config.subheading ? (
            <p className={cn("mt-2 opacity-90", isMobile ? "text-sm" : "text-base")}>{config.subheading}</p>
          ) : null}
          <span
            className="mt-5 inline-flex rounded-full px-5 py-2.5 text-sm font-bold shadow-sm"
            style={{ backgroundColor: config.theme.accent ?? config.theme.primary, color: "#fff" }}
          >
            {config.cta.label}
          </span>
        </div>
      </div>

      {config.description ? (
        <div className="border-t border-cream-100 px-6 py-4 text-sm leading-relaxed text-green-800">
          {config.description}
        </div>
      ) : null}

      {couponLabel ? (
        <div className="border-t border-cream-100 bg-terra-50/50 px-6 py-3 text-sm">
          <span className="font-semibold text-terra-800">Coupon: </span>
          <code className="rounded bg-white px-2 py-0.5 font-mono text-terra-700">{couponLabel}</code>
        </div>
      ) : null}

      {config.homepageSlot ? (
        <p className="border-t border-cream-100 px-6 py-2 text-xs text-green-700/50">
          Slot: {HOMEPAGE_SLOT_LABELS[config.homepageSlot]}
        </p>
      ) : null}
    </div>
  );
}
