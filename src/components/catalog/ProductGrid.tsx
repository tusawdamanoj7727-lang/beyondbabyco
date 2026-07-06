"use client";

import { useState } from "react";
import Link from "next/link";

import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { QuickCompareProvider } from "@/components/catalog/QuickCompareContext";
import { MICROCOPY } from "@/lib/brand/copy";
import ProductCard from "@/components/catalog/ProductCard";
import QuickViewModal from "@/components/catalog/QuickViewModal";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function ProductGrid({
  products,
  enableQuickView = true,
  enableCompare = true,
  className,
  hasActiveFilters = false,
}: {
  products: StorefrontProduct[];
  enableQuickView?: boolean;
  enableCompare?: boolean;
  className?: string;
  hasActiveFilters?: boolean;
}) {
  const [quickView, setQuickView] = useState<StorefrontProduct | null>(null);

  if (products.length === 0) {
    return (
      <CatalogEmptyState
        title={hasActiveFilters ? "No products found" : MICROCOPY.products.emptyTitle}
        description={
          hasActiveFilters
            ? MICROCOPY.products.filterEmptyDescription
            : MICROCOPY.products.emptyDescription
        }
        actionLabel={hasActiveFilters ? "Clear filters" : MICROCOPY.products.viewAll}
        actionHref="/products"
        secondaryLabel={MICROCOPY.products.backHome}
        secondaryHref="/"
        mascot="bella-bunny"
      />
    );
  }

  return (
    <QuickCompareProvider enabled={enableCompare}>
      <div className={cn("collection-product-grid", className)}>
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickView={enableQuickView ? setQuickView : undefined}
            enableCompare={enableCompare}
            showListingCta
            imagePriority={index < 2}
          />
        ))}
      </div>
      {enableQuickView ? (
        <QuickViewModal
          product={quickView}
          open={!!quickView}
          onOpenChange={(open) => !open && setQuickView(null)}
        />
      ) : null}
    </QuickCompareProvider>
  );
}

export function Pagination({
  page,
  pageCount,
  basePath,
  search,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  search: string;
}) {
  if (pageCount <= 1) return null;

  const pages = buildPageList(page, pageCount);

  return (
    <nav aria-label="Pagination" className="collection-pagination">
      {page > 1 ? (
        <PageLink href={`${basePath}${patchPage(search, page - 1)}`} label="Previous" active={false} />
      ) : null}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-green-700/50" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={`${basePath}${patchPage(search, p)}`}
            aria-current={p === page ? "page" : undefined}
            data-active={p === page ? "true" : "false"}
            className={cn("collection-page-link", focusRing)}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <PageLink href={`${basePath}${patchPage(search, page + 1)}`} label="Next" active={false} />
      ) : null}
    </nav>
  );
}

function buildPageList(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (page > 3) pages.push("…");
  for (let p = Math.max(2, page - 1); p <= Math.min(pageCount - 1, page + 1); p += 1) {
    pages.push(p);
  }
  if (page < pageCount - 2) pages.push("…");
  pages.push(pageCount);
  return pages;
}

function PageLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      data-active={active ? "true" : "false"}
      className={cn("collection-page-link px-4", focusRing)}
    >
      {label}
    </Link>
  );
}

function patchPage(search: string, page: number) {
  const sp = new URLSearchParams(search);
  if (page <= 1) sp.delete("page");
  else sp.set("page", String(page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}
