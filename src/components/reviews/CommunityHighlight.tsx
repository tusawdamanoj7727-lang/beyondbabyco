import Link from "next/link";

import type { CommunityHighlightItem } from "@/lib/reviews/types";
import { cn } from "@/lib/utils";

export default function CommunityHighlight({
  item,
  className,
}: {
  item: CommunityHighlightItem;
  className?: string;
}) {
  const inner = (
    <>
      {item.icon ? (
        <span className="text-2xl" aria-hidden="true">
          {item.icon}
        </span>
      ) : null}
      {item.stat ? (
        <p className="font-heading text-2xl font-extrabold text-green-900">{item.stat}</p>
      ) : null}
      <h3 className="mt-1 font-heading text-base font-bold text-green-900">{item.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-green-700/80">{item.description}</p>
      {item.href ? (
        <span className="mt-3 inline-block text-sm font-semibold text-terra-600">Learn more →</span>
      ) : null}
    </>
  );

  const classes = cn(
    "flex h-full flex-col rounded-2xl border border-cream-200 bg-white/90 p-5 shadow-card motion-safe:transition-shadow motion-safe:hover:shadow-lg",
    className,
  );

  if (item.href) {
    return (
      <Link href={item.href} className={cn(classes, "focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400")}>
        {inner}
      </Link>
    );
  }

  return <article className={classes}>{inner}</article>;
}
