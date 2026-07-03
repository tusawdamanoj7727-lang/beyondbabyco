"use client";

import { useEffect, useState } from "react";

import Icon from "../Icon";
import { Select, fieldControlClasses } from "../FormField";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/lib/supabase/database.types";

export interface ProductFiltersValue {
  search: string;
  status: ProductStatus | "all";
  brandId: string;
  categoryId: string;
  featured: boolean;
}

interface Option {
  id: string;
  name: string;
}

export default function Filters({
  value,
  brands,
  categories,
  onChange,
}: {
  value: ProductFiltersValue;
  brands: Option[];
  categories: Option[];
  onChange: (patch: Partial<ProductFiltersValue>) => void;
}) {
  const [search, setSearch] = useState(value.search);

  // Debounce free-text search.
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== value.search) onChange({ search });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    setSearch(value.search);
  }, [value.search]);

  const hasFilters =
    value.search || value.status !== "all" || value.brandId || value.categoryId || value.featured;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-green-600">
          <Icon name="search" size={18} />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          aria-label="Search products"
          className={cn(fieldControlClasses, "pl-11")}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
        <Select
          aria-label="Filter by status"
          value={value.status}
          onChange={(e) => onChange({ status: e.target.value as ProductStatus | "all" })}
          className="lg:w-36"
        >
          <option value="all">All statuses</option>
          <option value="active">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
          <option value="coming_soon">Coming soon</option>
        </Select>

        <Select
          aria-label="Filter by brand"
          value={value.brandId}
          onChange={(e) => onChange({ brandId: e.target.value })}
          className="lg:w-40"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filter by category"
          value={value.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
          className="lg:w-40"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <label
          className={cn(
            "flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-medium transition-colors",
            value.featured
              ? "border-green-500 bg-green-50 text-green-800"
              : "border-cream-300 bg-cream-50 text-green-700/70 hover:border-green-300",
          )}
        >
          <input
            type="checkbox"
            checked={value.featured}
            onChange={(e) => onChange({ featured: e.target.checked })}
            className="h-4 w-4 rounded border-cream-300 accent-green-600"
          />
          Featured
        </label>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() =>
            onChange({ search: "", status: "all", brandId: "", categoryId: "", featured: false })
          }
          className="flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium text-terra-600 transition-colors hover:bg-terra-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
        >
          <Icon name="close" size={16} />
          Clear
        </button>
      )}
    </div>
  );
}
