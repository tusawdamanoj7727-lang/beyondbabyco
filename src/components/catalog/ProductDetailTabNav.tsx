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

type ProductDetailTabNavProps = {
  activeTab: ProductDetailTab;
  onTabChange: (tab: ProductDetailTab) => void;
};

export default function ProductDetailTabNav({ activeTab, onTabChange }: ProductDetailTabNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={scrollRef}
      role="tablist"
      aria-label="Product information"
      className="sticky top-16 z-10 flex gap-1 overflow-x-auto border-b border-gray-100 bg-white scrollbar-hide"
    >
      {PDP_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          data-tab={tab}
          id={`tab-${tab}`}
          aria-selected={activeTab === tab}
          aria-controls={`panel-${tab}`}
          onClick={() => onTabChange(tab)}
          className={cn(
            "flex-shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === tab
              ? "border-[#2d5a27] text-[#2d5a27]"
              : "border-transparent text-gray-500",
            focusRing,
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
