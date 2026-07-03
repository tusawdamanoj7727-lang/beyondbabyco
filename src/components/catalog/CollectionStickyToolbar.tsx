"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export default function CollectionStickyToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 120);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={cn("collection-sticky-toolbar", scrolled && "is-scrolled", className)}>
      {children}
    </div>
  );
}
