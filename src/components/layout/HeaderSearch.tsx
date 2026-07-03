"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Mascot } from "@/components/mascots";
import { TRENDING_SEARCHES } from "@/lib/data";
import { focusRing, headerIconBtn, navGlass } from "@/lib/design/ui";
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

type HeaderSearchProps = {
  onNavigate?: () => void;
  className?: string;
};

export default function HeaderSearch({ onNavigate, className }: HeaderSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<StorefrontProduct[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setRecent(readRecent());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("[data-header-search-trigger]")
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const runSearch = useCallback((term: string) => {
    const q = term.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    startTransition(async () => {
      const items = await searchProductsAction(q);
      setSuggestions(items.slice(0, 5));
    });
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => runSearch(query), 280);
    return () => window.clearTimeout(t);
  }, [query, runSearch]);

  function navigateToSearch(term: string) {
    const q = term.trim();
    if (!q) return;
    const list = [q, ...readRecent().filter((t) => t !== q)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    setOpen(false);
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigateToSearch(query);
  }

  return (
    <div ref={panelRef} className={cn("relative", className)}>
      {!open ? (
        <button
          type="button"
          data-header-search-trigger
          aria-label="Open search"
          aria-expanded={false}
          aria-controls="header-search-panel"
          onClick={() => setOpen(true)}
          className={cn(headerIconBtn, focusRing)}
        >
          <Search className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      ) : (
        <form
          onSubmit={onSubmit}
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5",
            navGlass,
            "site-navbar-inner w-[min(92vw,320px)] lg:w-[min(36vw,380px)]",
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
          <label htmlFor="header-search-input" className="sr-only">
            Search products
          </label>
          <input
            ref={inputRef}
            id="header-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search baby care…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent font-body text-sm text-green-900 placeholder:text-green-700/50 focus:outline-none"
          />
          {pending ? (
            <span className="sr-only">Searching</span>
          ) : null}
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setOpen(false)}
            className={cn(headerIconBtn, "h-8 w-8 shrink-0", focusRing)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      )}

      {open ? (
        <div
          id="header-search-panel"
          role="dialog"
          aria-label="Search suggestions"
          className={cn(
            navGlass,
            "absolute right-0 top-[calc(100%+10px)] z-[80] w-[min(92vw,380px)] overflow-hidden rounded-3xl p-4 shadow-clay",
          )}
        >
          {query.trim().length >= 2 && suggestions.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-green-700/70">Products</p>
              <ul className="mt-2 space-y-1">
                {suggestions.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="block rounded-2xl px-3 py-2.5 text-sm transition-colors hover:bg-green-50"
                    >
                      <span className="font-medium text-green-900">{item.name}</span>
                      {item.categoryName ? (
                        <span className="ml-2 text-green-700/65">{item.categoryName}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : query.trim().length >= 2 && !pending ? (
            <div className="flex flex-col items-center py-4 text-center">
              <Mascot mascot="bella-bunny" pose="welcome" size={88} alt="" />
              <p className="mt-3 text-sm font-medium text-green-900">No matches yet</p>
              <p className="mt-1 text-xs text-green-700/70">Try a different keyword or browse all products.</p>
              <Link
                href="/products"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="mt-3 text-sm font-semibold text-terra-600 hover:text-terra-700"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <>
              {recent.length > 0 ? (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-700/70">Recent</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recent.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => navigateToSearch(term)}
                        className="rounded-full border border-cream-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-green-800 transition-colors hover:border-green-300"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-green-700/70">Trending</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TRENDING_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => navigateToSearch(term)}
                      className="rounded-full border border-green-200/80 bg-green-50/80 px-3 py-1.5 text-xs font-medium text-green-800 transition-colors hover:bg-green-100/80"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {recent.length === 0 ? (
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-green-50/60 px-3 py-3">
                  <Mascot mascot="bella-bunny" pose="welcome" size={56} alt="" />
                  <p className="text-left text-xs leading-relaxed text-green-700/80">
                    Search gentle, research-backed baby care products.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
