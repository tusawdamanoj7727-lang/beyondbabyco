"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { MICROCOPY } from "@/lib/brand/copy";
import ProductGrid from "@/components/catalog/ProductGrid";
import { searchProductsAction } from "@/lib/storefront/search-actions";
import type { StorefrontProduct } from "@/lib/catalog/types";

const RECENT_KEY = "bbc_recent_searches";

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  const list = [term, ...readRecent().filter((t) => t !== term)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

export default function SearchExperience({
  initialQuery = "",
  initialResults = [],
}: {
  initialQuery?: string;
  initialResults?: StorefrontProduct[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<StorefrontProduct[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  const runSearch = useCallback((term: string, navigate = false) => {
    const q = term.trim();
    if (!q) return;
    saveRecent(q);
    setRecent(readRecent());
    if (navigate) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      return;
    }
    startTransition(async () => {
      const items = await searchProductsAction(q);
      setSuggestions(items);
    });
  }, [router]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(() => runSearch(query), 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    saveRecent(q);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const suggestionCount = suggestions.length;
    const recentCount = suggestionCount === 0 && query.trim().length < 2 ? recent.length : 0;
    const total = suggestionCount || recentCount;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, total - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      router.push(`/products/${suggestions[activeIndex].slug}`);
    }
  }

  return (
    <div className="container pb-16">
      <form onSubmit={onSubmit} className="relative mx-auto max-w-2xl">
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-green-600" aria-hidden="true" />
        <input
          id="product-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={onKeyDown}
          placeholder={MICROCOPY.search.placeholder}
          autoComplete="off"
          className="h-14 w-full rounded-full border border-cream-300 bg-white pl-12 pr-4 text-base text-green-900 shadow-card focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/60"
        />
        {pending ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-green-600">{MICROCOPY.searching}</span>
        ) : null}

        {query.trim().length >= 2 && suggestions.length > 0 ? (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-clay"
          >
            {suggestions.map((item, index) => (
              <li key={item.id} role="option" aria-selected={activeIndex === index}>
                <Link
                  href={`/products/${item.slug}`}
                  className={`block px-4 py-3 text-sm transition-colors hover:bg-green-50 ${activeIndex === index ? "bg-green-50" : ""}`}
                >
                  <span className="font-semibold text-green-900">{item.name}</span>
                  {item.categoryName ? (
                    <span className="ml-2 text-green-700">{item.categoryName}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      {!initialQuery && recent.length > 0 ? (
        <div className="mx-auto mt-6 max-w-2xl">
          <p className="text-eyebrow text-green-700">{MICROCOPY.search.recentLabel}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {recent.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setQuery(term);
                  router.push(`/search?q=${encodeURIComponent(term)}`);
                }}
                className="rounded-full border border-cream-300 bg-white px-3 py-1.5 text-sm text-green-800 hover:border-green-300"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-10">
        {initialQuery && initialResults.length === 0 ? (
          <CatalogEmptyState
            title={MICROCOPY.search.noResultsTitle}
            description={MICROCOPY.search.noResultsDescription(initialQuery)}
            mascot="bella-bunny"
            actionLabel={MICROCOPY.search.browseAll}
            actionHref="/products"
            secondaryLabel={MICROCOPY.search.clearSearch}
            secondaryHref="/search"
          />
        ) : (
          <ProductGrid products={initialResults} enableQuickView={false} />
        )}
      </div>
    </div>
  );
}
