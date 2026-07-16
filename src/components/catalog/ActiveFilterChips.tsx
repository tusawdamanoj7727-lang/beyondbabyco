"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { catalogParamsToSearchParams, parseCatalogParams } from "@/lib/catalog/params";
import type { CatalogFilterOptions, CatalogSearchParams } from "@/lib/catalog/types";
import { focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type Chip = { key: string; label: string; clear: Partial<CatalogSearchParams> };

function buildChips(
  params: CatalogSearchParams,
  filters: CatalogFilterOptions,
): Chip[] {
  const chips: Chip[] = [];

  if (params.q) chips.push({ key: "q", label: `"${params.q}"`, clear: { q: undefined } });
  if (params.category) {
    const name = filters.categories.find((c) => c.slug === params.category)?.name ?? params.category;
    chips.push({ key: "category", label: name, clear: { category: undefined } });
  }
  if (params.age) {
    const name = filters.ageGroups.find((a) => a.slug === params.age)?.name ?? params.age;
    chips.push({ key: "age", label: name, clear: { age: undefined } });
  }
  if (params.type) {
    const name = filters.productTypes.find((t) => t.slug === params.type)?.name ?? params.type;
    chips.push({ key: "type", label: name, clear: { type: undefined } });
  }
  if (params.brand) {
    const name = filters.brands.find((b) => b.slug === params.brand)?.name ?? params.brand;
    chips.push({ key: "brand", label: name, clear: { brand: undefined } });
  }
  if (params.minPrice != null) chips.push({ key: "minPrice", label: `From ₹${params.minPrice}`, clear: { minPrice: undefined } });
  if (params.maxPrice != null) chips.push({ key: "maxPrice", label: `Up to ₹${params.maxPrice}`, clear: { maxPrice: undefined } });
  if (params.inStock) chips.push({ key: "inStock", label: "In stock", clear: { inStock: undefined } });
  if (params.minRating != null && params.minRating > 0) {
    chips.push({ key: "minRating", label: `${params.minRating}★+`, clear: { minRating: undefined } });
  }

  return chips;
}

export default function ActiveFilterChips({
  filters,
  params,
  className,
}: {
  filters: CatalogFilterOptions;
  params: CatalogSearchParams;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const current = useMemo(
    () => parseCatalogParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );

  const chips = useMemo(() => buildChips(params, filters), [params, filters]);

  const pushParams = useCallback(
    (patch: Partial<CatalogSearchParams>) => {
      const next = { ...current, ...patch, page: 1 };
      const sp = catalogParamsToSearchParams(next);
      router.push(`/products${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
    },
    [current, router],
  );

  if (chips.length === 0) return null;

  return (
    <div className={cn("mt-3 flex flex-wrap items-center gap-2", className)}>
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-green-700">Active</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => pushParams(chip.clear)}
          className={cn("collection-active-chip", focusRing)}
        >
          {chip.label}
          <X className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => router.push("/products")}
        className="text-xs font-semibold text-terra-600 hover:text-terra-700"
      >
        Clear all
      </button>
    </div>
  );
}
