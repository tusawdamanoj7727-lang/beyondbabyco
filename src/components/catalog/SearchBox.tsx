"use client";

import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { MICROCOPY } from "@/lib/brand/copy";
import { focusRing } from "@/lib/design/ui";
import { useCoarsePointer } from "@/lib/a11y/use-coarse-pointer";
import { searchProductsAction } from "@/lib/storefront/search-actions";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

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

/** Interactive search box only — results stay server-rendered on the page. */
export default function SearchBox({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const coarse = useCoarsePointer();
  const listboxId = useId();
  const statusId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<StorefrontProduct[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [listOpen, setListOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const runSearch = useCallback(
    (term: string, navigate = false) => {
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
        setListOpen(true);
      });
    },
    [router],
  );

  useEffect(() => {
    if (coarse) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(() => runSearch(query), 450);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, runSearch, coarse]);

  const showingRecent =
    !coarse && suggestions.length === 0 && query.trim().length < 2 && recent.length > 0 && listOpen;
  const showingSuggestions =
    !coarse && query.trim().length >= 2 && suggestions.length > 0 && listOpen;
  const optionCount = showingSuggestions ? suggestions.length : showingRecent ? recent.length : 0;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    saveRecent(q);
    setListOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function selectRecent(term: string) {
    setQuery(term);
    setListOpen(false);
    saveRecent(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setListOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === "ArrowDown") {
      if (optionCount === 0) return;
      e.preventDefault();
      setListOpen(true);
      setActiveIndex((i) => Math.min(i + 1, optionCount - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      if (optionCount === 0) return;
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
      return;
    }

    if (e.key === "Enter" && activeIndex >= 0) {
      if (showingSuggestions && suggestions[activeIndex]) {
        e.preventDefault();
        setListOpen(false);
        router.push(`/products/${suggestions[activeIndex].slug}`);
        return;
      }
      if (showingRecent && recent[activeIndex]) {
        e.preventDefault();
        selectRecent(recent[activeIndex]);
      }
    }
  }

  const statusMessage = pending
    ? MICROCOPY.searching
    : query.trim().length >= 2 && !pending
      ? suggestions.length > 0
        ? `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"}`
        : "No live suggestions — press Enter to search"
      : "";

  return (
    <div className="relative mx-auto max-w-2xl">
      <form onSubmit={onSubmit} className="relative" role="search">
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-green-600"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id="product-search"
          type="search"
          role="combobox"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            if (!coarse) setListOpen(true);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (!coarse) setListOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setListOpen(false), 150);
          }}
          placeholder={MICROCOPY.search.placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showingSuggestions || showingRecent}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          aria-describedby={statusId}
          className={cn(
            "h-14 w-full rounded-full border border-cream-300 bg-white pl-12 pr-12 text-base text-green-900 shadow-card touch-manipulation",
            "placeholder:text-green-600/70",
            focusRing,
          )}
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            className={cn(
              "absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-green-700 hover:bg-green-50",
              focusRing,
            )}
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}

        <p id={statusId} className="sr-only" aria-live="polite">
          {statusMessage}
        </p>

        {pending ? (
          <span
            className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 text-xs font-medium text-green-600"
            aria-hidden="true"
          >
            {MICROCOPY.searching}
          </span>
        ) : null}

        {showingSuggestions ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-clay"
          >
            {suggestions.map((item, index) => (
              <li
                key={item.id}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={activeIndex === index}
              >
                <Link
                  href={`/products/${item.slug}`}
                  className={cn(
                    "block px-4 py-3 text-sm transition-colors hover:bg-green-50",
                    activeIndex === index && "bg-green-50",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span className="font-semibold text-green-900">{item.name}</span>
                  {item.categoryName ? (
                    <span className="ml-2 text-green-700">{item.categoryName}</span>
                  ) : null}
                </Link>
              </li>
            ))}
            <li className="border-t border-cream-100 px-4 py-2.5 text-xs text-green-600">
              Press Enter to see all results for “{query.trim()}”
            </li>
          </ul>
        ) : null}

        {showingRecent ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={MICROCOPY.search.recentLabel}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-clay"
          >
            <li className="px-4 py-2 text-eyebrow text-green-700">{MICROCOPY.search.recentLabel}</li>
            {recent.map((term, index) => (
              <li
                key={term}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={activeIndex === index}
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full px-4 py-3 text-left text-sm text-green-800 transition-colors hover:bg-green-50",
                    activeIndex === index && "bg-green-50",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectRecent(term)}
                >
                  {term}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      {!initialQuery && recent.length > 0 ? (
        <div className="mt-6">
          <p className="text-eyebrow text-green-700">{MICROCOPY.search.recentLabel}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {recent.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => selectRecent(term)}
                className={cn(
                  "min-h-11 rounded-full border border-cream-300 bg-white px-3.5 py-2 text-sm font-medium text-green-800 hover:border-green-300 hover:bg-green-50/60",
                  focusRing,
                )}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
