"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Select, fieldControlClasses } from "@/components/admin/FormField";
import type { FilterOptions, ReportFilters } from "@/lib/admin/report-types";
import { QUICK_DATE_RANGES, type QuickDateRangeId } from "@/lib/analytics/types";
import { detectQuickRange, resolveQuickDateRange } from "@/lib/analytics/date-ranges";
import { cn } from "@/lib/utils";

export default function AnalyticsToolbar({
  filters,
  options,
  basePath,
  className,
}: {
  filters: ReportFilters;
  options: FilterOptions;
  basePath: string;
  className?: string;
}) {
  const router = useRouter();
  const [quickRange, setQuickRange] = useState<QuickDateRangeId>(() => detectQuickRange(filters));
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("analytics-theme");
    const prefersDark = stored === "dark";
    setDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  function push(patch: Partial<ReportFilters>) {
    const sp = new URLSearchParams();
    const merged = { ...filters, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, String(v));
    }
    router.push(`${basePath}?${sp.toString()}`);
  }

  function applyQuickRange(id: QuickDateRangeId) {
    setQuickRange(id);
    if (id === "custom") return;
    const { dateFrom, dateTo } = resolveQuickDateRange(id);
    push({ dateFrom, dateTo });
  }

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("analytics-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-3xl border border-cream-200 bg-white p-4 dark:border-green-800 dark:bg-green-950/40 lg:flex-row lg:flex-wrap lg:items-end",
        className,
      )}
      role="search"
      aria-label="Analytics filters"
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick date ranges">
        {QUICK_DATE_RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => applyQuickRange(r.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400",
              quickRange === r.id
                ? "bg-green-900 text-white dark:bg-terra-600"
                : "bg-cream-100 text-green-800 hover:bg-cream-200 dark:bg-green-900 dark:text-green-100",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <label className="text-xs font-semibold text-green-700/70 dark:text-green-200/70">
        From
        <input
          type="date"
          aria-label="Date from"
          value={filters.dateFrom ?? ""}
          onChange={(e) => {
            setQuickRange("custom");
            push({ dateFrom: e.target.value || undefined });
          }}
          className={fieldControlClasses + " mt-1 block"}
        />
      </label>
      <label className="text-xs font-semibold text-green-700/70 dark:text-green-200/70">
        To
        <input
          type="date"
          aria-label="Date to"
          value={filters.dateTo ?? ""}
          onChange={(e) => {
            setQuickRange("custom");
            push({ dateTo: e.target.value || undefined });
          }}
          className={fieldControlClasses + " mt-1 block"}
        />
      </label>

      <label className="text-xs font-semibold text-green-700/70 dark:text-green-200/70">
        Category
        <Select
          aria-label="Category"
          value={filters.categoryId ?? ""}
          onChange={(e) => push({ categoryId: e.target.value || undefined })}
          className="mt-1 min-w-[140px]"
        >
          <option value="">All</option>
          {options.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </label>

      <button
        type="button"
        onClick={toggleTheme}
        className="ml-auto inline-flex h-10 items-center gap-2 rounded-2xl border border-cream-200 px-3 text-sm font-medium text-green-800 hover:bg-cream-50 dark:border-green-700 dark:text-green-100 dark:hover:bg-green-900"
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
        {dark ? "Light" : "Dark"}
      </button>
    </div>
  );
}
