"use client";

import Link from "next/link";

import type { StorefrontCampaignSlot } from "@/lib/admin/campaign-center";
import { cn } from "@/lib/utils";

export default function CampaignAnnouncementBar({
  slot,
  className,
}: {
  slot: StorefrontCampaignSlot;
  className?: string;
}) {
  return (
    <div
      className={cn("border-b border-cream-200 py-2.5 text-center text-sm", className)}
      style={{ backgroundColor: slot.theme.background, color: slot.theme.primary }}
      role="region"
      aria-label="Campaign announcement"
    >
      <p className="font-medium">
        {slot.headline}
        {slot.subheading ? <span className="ml-2 opacity-80">{slot.subheading}</span> : null}
        {" · "}
        <Link href={slot.ctaUrl} className="font-bold underline underline-offset-2 hover:opacity-80">
          {slot.ctaLabel}
        </Link>
      </p>
    </div>
  );
}
