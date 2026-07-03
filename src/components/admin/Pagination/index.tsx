"use client";

import Icon from "../Icon";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

function pageWindow(page: number, pageCount: number): number[] {
  const span = 1;
  const pages = new Set<number>([1, pageCount]);
  for (let p = page - span; p <= page + span; p++) {
    if (p >= 1 && p <= pageCount) pages.add(p);
  }
  return [...pages].sort((a, b) => a - b);
}

export default function Pagination({
  page,
  pageCount,
  total,
  perPage,
  onPageChange,
}: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  const windowed = pageWindow(page, pageCount);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-xs text-green-700/60">
        Showing <span className="font-semibold text-green-800">{from}</span>–
        <span className="font-semibold text-green-800">{to}</span> of{" "}
        <span className="font-semibold text-green-800">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="grid h-9 w-9 place-items-center rounded-xl border border-cream-300 bg-white text-green-800 transition-colors hover:bg-cream-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
        >
          <Icon name="chevronLeft" size={16} />
        </button>

        {windowed.map((p, i) => {
          const prev = windowed[i - 1];
          const gap = prev && p - prev > 1;
          return (
            <span key={p} className="flex items-center">
              {gap && <span className="px-1 text-green-700/40">…</span>}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "h-9 min-w-9 rounded-xl px-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
                  p === page
                    ? "bg-green-500 text-cream-50"
                    : "border border-cream-300 bg-white text-green-800 hover:bg-cream-100",
                )}
              >
                {p}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
          className="grid h-9 w-9 place-items-center rounded-xl border border-cream-300 bg-white text-green-800 transition-colors hover:bg-cream-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
    </nav>
  );
}
