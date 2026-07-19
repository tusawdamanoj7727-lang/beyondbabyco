"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { SlidersHorizontal, X } from "lucide-react";

import Button from "@/components/ui/Button";
import { catalogParamsToSearchParams, parseCatalogParams } from "@/lib/catalog/params";
import type { CatalogFilterOptions, CatalogSearchParams, StorefrontSort } from "@/lib/catalog/types";
import { ctaHeight, focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: StorefrontSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "best_selling", label: "Best Selling" },
  { value: "rating", label: "Highest Rated" },
];

function FilterPanel({
  filters,
  params,
  onChange,
  className,
}: {
  filters: CatalogFilterOptions;
  params: CatalogSearchParams;
  onChange: (next: Partial<CatalogSearchParams>) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-7", className)}>
      <FilterGroup title="Categories">
        <FilterRadio
          options={[{ slug: "", name: "All categories" }, ...filters.categories.map((c) => ({ slug: c.slug, name: c.name }))]}
          value={params.category ?? ""}
          onChange={(v) => onChange({ category: v || undefined, page: 1 })}
          name="category"
        />
      </FilterGroup>

      {filters.ageGroups.length > 0 ? (
        <FilterGroup title="Age Group">
          <FilterRadio
            options={[{ slug: "", name: "All ages" }, ...filters.ageGroups.map((c) => ({ slug: c.slug, name: c.name }))]}
            value={params.age ?? ""}
            onChange={(v) => onChange({ age: v || undefined, page: 1 })}
            name="age"
          />
        </FilterGroup>
      ) : null}

      {filters.productTypes.length > 0 ? (
        <FilterGroup title="Product Type">
          <FilterRadio
            options={[{ slug: "", name: "All types" }, ...filters.productTypes.map((c) => ({ slug: c.slug, name: c.name }))]}
            value={params.type ?? ""}
            onChange={(v) => onChange({ type: v || undefined, page: 1 })}
            name="type"
          />
        </FilterGroup>
      ) : null}

      <FilterGroup title="Brand">
        <FilterRadio
          options={[{ slug: "", name: "All brands" }, ...filters.brands.map((b) => ({ slug: b.slug, name: b.name }))]}
          value={params.brand ?? ""}
          onChange={(v) => onChange({ brand: v || undefined, page: 1 })}
          name="brand"
        />
      </FilterGroup>

      <FilterGroup title="Price Range">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-green-700">
            Min
            <input
              type="number"
              min={0}
              defaultValue={params.minPrice ?? ""}
              onBlur={(e) =>
                onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })
              }
              className="mt-1.5 h-11 w-full rounded-xl border border-cream-300 bg-white px-3 text-sm shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500/60"
            />
          </label>
          <label className="text-xs font-semibold text-green-700">
            Max
            <input
              type="number"
              min={0}
              defaultValue={params.maxPrice ?? ""}
              onBlur={(e) =>
                onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })
              }
              className="mt-1.5 h-11 w-full rounded-xl border border-cream-300 bg-white px-3 text-sm shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500/60"
            />
          </label>
        </div>
      </FilterGroup>

      <FilterGroup title="Availability">
        <label className="collection-filter-option">
          <input
            type="checkbox"
            checked={!!params.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked || undefined, page: 1 })}
            className="h-4 w-4 rounded border-cream-300 accent-green-600"
          />
          In stock only
        </label>
      </FilterGroup>

      <FilterGroup title="Rating">
        <FilterRadio
          options={[
            { slug: "", name: "Any rating" },
            { slug: "4", name: "4★ & above" },
            { slug: "3", name: "3★ & above" },
          ]}
          value={params.minRating != null ? String(params.minRating) : ""}
          onChange={(v) => onChange({ minRating: v ? Number(v) : undefined, page: 1 })}
          name="rating"
        />
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="collection-filter-group-title">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function FilterRadio({
  options,
  value,
  onChange,
  name,
}: {
  options: { slug: string; name: string }[];
  value: string;
  onChange: (slug: string) => void;
  name: string;
}) {
  return (
    <ul className="max-h-48 space-y-0.5 overflow-y-auto pr-1">
      {options.map((opt) => (
        <li key={`${name}-${opt.slug || "all"}`}>
          <label className="collection-filter-option">
            <input
              type="radio"
              name={name}
              checked={value === opt.slug}
              onChange={() => onChange(opt.slug)}
              className="accent-green-600"
            />
            {opt.name}
          </label>
        </li>
      ))}
    </ul>
  );
}

export default function CatalogToolbar({
  filters,
  total,
  params,
}: {
  filters: CatalogFilterOptions;
  total: number;
  params: CatalogSearchParams;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const current = useMemo(
    () => parseCatalogParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );

  const pushParams = useCallback(
    (patch: Partial<CatalogSearchParams>) => {
      const next = { ...current, ...patch };
      const sp = catalogParamsToSearchParams(next);
      router.push(`/products${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
    },
    [current, router],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="collection-toolbar-count">
        <strong>{total}</strong> {total === 1 ? "product" : "products"}
      </p>

      <div className="flex flex-wrap items-center gap-2.5">
        <label className="sr-only" htmlFor="catalog-sort">
          Sort products
        </label>
        <select
          id="catalog-sort"
          value={params.sort ?? "featured"}
          onChange={(e) => pushParams({ sort: e.target.value as StorefrontSort, page: 1 })}
          aria-label="Sort products"
          className={cn(
            "collection-sort-select min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500/60",
            focusRing,
          )}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button variant="secondary" size="md" type="button" className={cn("lg:hidden", ctaHeight, "rounded-full px-5")}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[80] bg-green-950/45 backdrop-blur-sm lg:hidden" />
            <Dialog.Content className="collection-mobile-filter-sheet lg:hidden">
              <div className="mb-5 flex items-center justify-between gap-3">
                <Dialog.Title className="font-heading text-lg font-bold text-green-900">
                  Filters
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close filters"
                    className={cn("rounded-full p-2 text-green-700 hover:bg-green-50", focusRing)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>
              <FilterPanel filters={filters} params={current} onChange={pushParams} />
              <div className="mt-6 flex gap-2">
                <Dialog.Close asChild>
                  <Button variant="primary" fullWidth className={cn(ctaHeight, "font-semibold")}>
                    Show {total} products
                  </Button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}

export function CatalogFiltersSidebar({
  filters,
}: {
  filters: CatalogFilterOptions;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const current = useMemo(
    () => parseCatalogParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );

  const pushParams = useCallback(
    (patch: Partial<CatalogSearchParams>) => {
      const next = { ...current, ...patch };
      const sp = catalogParamsToSearchParams(next);
      router.push(`/products${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
    },
    [current, router],
  );

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-32 collection-filters-panel">
        <h2 className="font-heading text-base font-bold text-green-900">Refine</h2>
        <p className="mt-1 text-xs leading-relaxed text-green-700">Filter by category, age, price, and more.</p>
        <div className="mt-5">
          <FilterPanel filters={filters} params={current} onChange={pushParams} />
        </div>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="mt-6 text-sm font-semibold text-terra-600 hover:text-terra-700"
        >
          Clear all filters
        </button>
      </div>
    </aside>
  );
}
