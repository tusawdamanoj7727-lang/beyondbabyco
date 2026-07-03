"use client";

import { GitCompare, X } from "lucide-react";

import Button from "@/components/ui/Button";
import { useQuickCompareOptional } from "@/components/catalog/QuickCompareContext";
import { ctaHeight, focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function QuickCompareBar({ onCompare }: { onCompare: () => void }) {
  const compare = useQuickCompareOptional();
  if (!compare || compare.selected.length === 0) return null;

  return (
    <div className="collection-compare-bar">
      <div className="container flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <GitCompare className="h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
          <p className="truncate text-sm font-semibold text-green-900">
            {compare.selected.length} selected for compare
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={compare.clear}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-green-800 transition-colors hover:bg-green-50",
              focusRing,
            )}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear
          </button>
          <Button
            variant="primary"
            type="button"
            disabled={compare.selected.length < 2}
            onClick={onCompare}
            className={cn(ctaHeight, "px-6 text-sm font-semibold")}
          >
            Compare
          </Button>
        </div>
      </div>
    </div>
  );
}
