"use client";

import { useEffect, useRef } from "react";

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

/** Stable DOM ids for aria-controls (avoid "&" in Q&A). */
export function pdpTabId(tab: ProductDetailTab): string {
  return tab === "Q&A" ? "qa" : tab.toLowerCase();
}

type ProductDetailTabNavProps = {
  activeTab: ProductDetailTab;
  onTabChange: (tab: ProductDetailTab) => void;
  showQa?: boolean;
};

export default function ProductDetailTabNav({
  activeTab,
  onTabChange,
  showQa = true,
}: ProductDetailTabNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabs: ProductDetailTab[] = showQa ? [...PDP_TABS] : PDP_TABS.filter((t) => t !== "Q&A");

  useEffect(() => {
    const activeButton = scrollRef.current?.querySelector<HTMLButtonElement>(
      `[data-tab="${activeTab}"]`,
    );
    activeButton?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeTab]);

  function selectTab(tab: ProductDetailTab) {
    onTabChange(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${pdpTabId(tab)}`);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    const next = tabs[nextIndex];
    if (!next) return;
    selectTab(next);
    scrollRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)?.focus();
  }

  return (
    <div
      ref={scrollRef}
      role="tablist"
      aria-label="Product information"
      onKeyDown={onKeyDown}
      className="sticky top-16 z-10 flex gap-1 overflow-x-auto border-b border-gray-100 bg-white scrollbar-hide"
    >
      {tabs.map((tab) => {
        const selected = activeTab === tab;
        const id = pdpTabId(tab);
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            data-tab={tab}
            id={`tab-${id}`}
            tabIndex={selected ? 0 : -1}
            aria-selected={selected}
            aria-controls={`panel-${id}`}
            onClick={() => selectTab(tab)}
            className={cn(
              "flex-shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              selected
                ? "border-brand-forest text-brand-forest"
                : "border-transparent text-gray-600",
              focusRing,
            )}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
