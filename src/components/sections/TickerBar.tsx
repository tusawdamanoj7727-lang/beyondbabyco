import { Fragment } from "react";

import { getAnnouncementTickerItems } from "@/lib/brand/announcement-ticker";
import { announcementBar } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

function TickerSet({ items, ariaHidden = false }: { items: readonly string[]; ariaHidden?: boolean }) {
  return (
    <div aria-hidden={ariaHidden || undefined} className="flex shrink-0 items-center">
      {items.map((label, index) => (
        <Fragment key={`${label}-${index}`}>
          <span className="whitespace-nowrap font-body text-[13px] font-medium tracking-wide text-cream-50/95 sm:text-sm">
            {label}
          </span>
          <span aria-hidden="true" className="mx-4 shrink-0 text-sm font-normal text-cream-50/40 sm:mx-5">
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
  link,
}: {
  items?: readonly string[];
  backgroundColor?: string;
  link?: string;
}) {
  const items = getAnnouncementTickerItems(initialItems?.length ? initialItems : undefined);

  const content = (
    <div
      role="region"
      aria-label="Store announcements"
      className={cn(announcementBar, "group relative w-full overflow-hidden")}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div
        className={cn(
          "flex w-max items-center py-2.5 will-change-transform",
          "animate-[ticker_40s_linear_infinite]",
          "group-hover:[animation-play-state:paused]",
          "motion-reduce:animate-none",
        )}
      >
        <TickerSet items={items} />
        <TickerSet items={items} ariaHidden />
      </div>
    </div>
  );

  if (link) {
    return (
      <a href={link} className="block no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terra-400">
        {content}
      </a>
    );
  }

  return content;
}
