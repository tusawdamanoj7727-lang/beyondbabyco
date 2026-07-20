import { Fragment } from "react";
import Link from "next/link";

import { getAnnouncementTickerItems } from "@/lib/brand/announcement-ticker";
import { announcementBar } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

function TickerSet({
  items,
  ariaHidden = false,
  textColor,
}: {
  items: readonly string[];
  ariaHidden?: boolean;
  textColor?: string;
}) {
  return (
    <div aria-hidden={ariaHidden || undefined} className="flex shrink-0 items-center">
      {items.map((label, index) => (
        <Fragment key={`${label}-${index}`}>
          <span
            className="whitespace-nowrap font-body text-[13px] font-medium tracking-wide sm:text-sm"
            style={textColor ? { color: textColor } : undefined}
          >
            {label}
          </span>
          <span
            aria-hidden="true"
            className="mx-4 shrink-0 text-sm font-normal opacity-40 sm:mx-5"
            style={textColor ? { color: textColor } : undefined}
          >
            •
          </span>
        </Fragment>
      ))}
    </div>
  );
}

export default function TickerBar({
  items: initialItems,
  backgroundColor,
  textColor,
  link,
  ctaLabel,
  ctaUrl,
  rotationSpeedMs = 40000,
  pauseOnHover = true,
  autoPlay = true,
}: {
  items?: readonly string[];
  backgroundColor?: string;
  textColor?: string;
  link?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  rotationSpeedMs?: number;
  pauseOnHover?: boolean;
  autoPlay?: boolean;
  maxVisible?: number;
  mobileSwipe?: boolean;
}) {
  const items = getAnnouncementTickerItems(initialItems?.length ? initialItems : undefined);
  const resolvedText = textColor || undefined;
  const duration = Math.max(8000, rotationSpeedMs || 40000);

  const content = (
    <div
      role="region"
      aria-label="Store announcements"
      className={cn(announcementBar, "group relative flex w-full items-center overflow-hidden")}
      style={{
        ...(backgroundColor ? { backgroundColor } : {}),
        ...(resolvedText ? { color: resolvedText } : {}),
      }}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center overflow-hidden",
          "touch-pan-x",
          ctaLabel && ctaUrl ? "pr-2" : "",
        )}
      >
        <div
          className={cn(
            "flex w-max items-center py-2.5 will-change-transform",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            "motion-reduce:!animate-none",
          )}
          style={
            autoPlay
              ? { animation: `ticker ${duration}ms linear infinite` }
              : undefined
          }
        >
          <TickerSet items={items} textColor={resolvedText} />
          <TickerSet items={items} ariaHidden textColor={resolvedText} />
        </div>
      </div>
      {ctaLabel && ctaUrl ? (
        <Link
          href={ctaUrl}
          className="relative z-10 mr-3 shrink-0 rounded-full border border-current/30 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-400 sm:mr-4 sm:text-sm"
          style={resolvedText ? { color: resolvedText } : undefined}
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );

  if (link && !(ctaLabel && ctaUrl)) {
    return (
      <a
        href={link}
        className="block no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terra-400"
      >
        {content}
      </a>
    );
  }

  return content;
}
