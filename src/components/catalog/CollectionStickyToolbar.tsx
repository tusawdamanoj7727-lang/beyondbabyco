"use client";

import { cn } from "@/lib/utils";

/** Sticky catalog toolbar — border/shadow via CSS only (no scroll listeners). */
export default function CollectionStickyToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("collection-sticky-toolbar", className)}>{children}</div>;
}
