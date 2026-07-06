"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export const PDP_TABS = [
  "Benefits",
  "Ingredients",
  "Directions",
  "Safety",
  "FAQ",
  "Research",
  "Reviews",
  "Q&A",
] as const;

export type ProductDetailTab = (typeof PDP_TABS)[number];

const MOBILE_PRIMARY_TABS: ProductDetailTab[] = ["Benefits", "Ingredients", "FAQ", "Reviews"];
const MOBILE_SECONDARY_TABS = PDP_TABS.filter(
  (t) => !MOBILE_PRIMARY_TABS.includes(t),
) as ProductDetailTab[];

type ProductDetailTabNavProps = {
  activeTab: ProductDetailTab;
  onTabChange: (tab: ProductDetailTab) => void;
};

export default function ProductDetailTabNav({ activeTab, onTabChange }: ProductDetailTabNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const startSentinelRef = useRef<HTMLSpanElement>(null);
  const endSentinelRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef(new Map<ProductDetailTab, HTMLButtonElement>());

  const [isMobile, setIsMobile] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (isMobile && MOBILE_SECONDARY_TABS.includes(activeTab)) {
      setMobileExpanded(true);
    }
  }, [activeTab, isMobile]);

  const visibleTabs = useMemo(() => {
    if (!isMobile || mobileExpanded) return PDP_TABS;
    return MOBILE_PRIMARY_TABS;
  }, [isMobile, mobileExpanded]);

  const showMoreButton = isMobile && !mobileExpanded;

  const setTabRef = useCallback((tab: ProductDetailTab, node: HTMLButtonElement | null) => {
    if (node) tabRefs.current.set(tab, node);
    else tabRefs.current.delete(tab);
  }, []);

  useEffect(() => {
    tabRefs.current.get(activeTab)?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeTab, mobileExpanded, visibleTabs.length]);

  useEffect(() => {
    const root = scrollRef.current;
    const start = startSentinelRef.current;
    const end = endSentinelRef.current;
    if (!root || !start || !end) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === start) setShowLeftFade(!entry.isIntersecting);
          if (entry.target === end) setShowRightFade(!entry.isIntersecting);
        }
      },
      { root, threshold: 1 },
    );

    observer.observe(start);
    observer.observe(end);

    return () => observer.disconnect();
  }, [visibleTabs.length, showMoreButton, mobileExpanded]);

  return (
    <div className="pdp-tabs-nav relative">
      {showLeftFade ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-cream-50 via-cream-50/80 to-transparent md:w-10"
        />
      ) : null}
      {showRightFade ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-cream-50 via-cream-50/80 to-transparent md:w-10"
        />
      ) : null}

      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-1 overflow-x-auto pb-1 -mb-px"
      >
        <span ref={startSentinelRef} className="h-px w-px shrink-0" aria-hidden="true" />

        <div role="tablist" aria-label="Product information" className="flex min-w-max gap-1">
          {visibleTabs.map((t) => (
            <button
              key={t}
              ref={(node) => setTabRef(t, node)}
              type="button"
              role="tab"
              id={`tab-${t}`}
              aria-selected={activeTab === t}
              aria-controls={`panel-${t}`}
              onClick={() => onTabChange(t)}
              className={cn("pdp-tab-trigger shrink-0 whitespace-nowrap", focusRing)}
            >
              {t}
            </button>
          ))}

          {showMoreButton ? (
            <button
              type="button"
              onClick={() => setMobileExpanded(true)}
              className={cn(
                "pdp-tab-trigger shrink-0 whitespace-nowrap text-terra-600",
                focusRing,
              )}
              aria-label="Show more product information tabs"
            >
              More
            </button>
          ) : null}
        </div>

        <span ref={endSentinelRef} className="h-px w-px shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
}
