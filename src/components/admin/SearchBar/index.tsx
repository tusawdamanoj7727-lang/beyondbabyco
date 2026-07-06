"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Icon from "../Icon";
import { ALL_NAV_ITEMS, canSeeNavItem, type NavItem } from "../nav";
import { useAdmin } from "../context";
import { useRole } from "@/lib/auth/hooks";
import { roleHasPermission } from "@/lib/auth/permissions";
import { searchAdminEntities, type AdminSearchResult } from "@/lib/admin/admin-search-actions";
import { cn } from "@/lib/utils";

type SearchRow =
  | { kind: "nav"; item: NavItem }
  | { kind: "entity"; item: AdminSearchResult };

const ENTITY_ICONS: Record<AdminSearchResult["type"], string> = {
  product: "products",
  order: "orders",
  customer: "customers",
  coupon: "coupons",
  media: "media",
  review: "reviews",
  nav: "search",
};

export default function SearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMac, setIsMac] = useState(true);
  const [entities, setEntities] = useState<AdminSearchResult[]>([]);
  const [entityLoading, setEntityLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { role: initialRole } = useAdmin();
  const { role: liveRole, hasPermission, loading } = useRole();
  const role = loading ? initialRole : liveRole;

  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.platform));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setEntities([]);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const visibleItems = useMemo(
    () =>
      ALL_NAV_ITEMS.filter((item) =>
        canSeeNavItem(
          item,
          role,
          loading ? (p) => roleHasPermission(role, p) : hasPermission,
        ),
      ),
    [role, loading, hasPermission],
  );

  const navResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleItems;
    return visibleItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [query, visibleItems]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setEntities([]);
      setEntityLoading(false);
      return;
    }

    setEntityLoading(true);
    const handle = window.setTimeout(() => {
      searchAdminEntities(q)
        .then(setEntities)
        .catch(() => setEntities([]))
        .finally(() => setEntityLoading(false));
    }, 220);

    return () => window.clearTimeout(handle);
  }, [query]);

  const rows = useMemo<SearchRow[]>(() => {
    const list: SearchRow[] = navResults.map((item) => ({ kind: "nav", item }));
    for (const item of entities) {
      list.push({ kind: "entity", item });
    }
    return list;
  }, [navResults, entities]);

  useEffect(() => {
    setActiveIndex((i) => (rows.length ? Math.min(i, rows.length - 1) : 0));
  }, [rows.length]);

  const go = useCallback(
    (row: SearchRow) => {
      if (row.kind === "nav") {
        if (row.item.soon) return;
        setOpen(false);
        router.push(row.item.href);
        return;
      }
      setOpen(false);
      router.push(row.item.href);
    },
    [router],
  );

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && rows[activeIndex]) {
      e.preventDefault();
      go(rows[activeIndex]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open global search"
        aria-keyshortcuts="Meta+K Control+K"
        className="group flex h-10 w-full items-center gap-2.5 rounded-2xl border border-cream-300 bg-cream-50 px-3.5 text-left text-sm text-green-700/50 transition-colors hover:border-green-300 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
      >
        <Icon name="search" size={18} />
        <span className="flex-1 truncate">Search products, orders, pages…</span>
        <kbd className="hidden items-center gap-0.5 rounded-md border border-cream-300 bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-green-700/60 sm:inline-flex">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>

      {open ? (
        <div className="animate-drawer-backdrop-in fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]">
          <div
            className="absolute inset-0 bg-green-900/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
            className="animate-search-dialog-in relative z-10 w-full max-w-xl overflow-hidden rounded-4xl border border-cream-300 bg-white shadow-clay"
            onKeyDown={onListKeyDown}
          >
              <div className="flex items-center gap-3 border-b border-cream-200 px-4">
                <span className="text-green-600">
                  <Icon name="search" size={20} />
                </span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder="Search products, orders, customers…"
                  aria-label="Search admin"
                  className="h-14 flex-1 bg-transparent text-base text-green-900 placeholder:text-green-700/40 focus:outline-none"
                />
                <kbd className="rounded-md border border-cream-300 bg-cream-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-green-700/50">
                  Esc
                </kbd>
              </div>

              <ul className="max-h-[55vh] overflow-y-auto p-2" role="listbox" aria-label="Results">
                {rows.length === 0 && !entityLoading ? (
                  <li className="px-4 py-8 text-center text-sm text-green-700/50">
                    {query.trim().length >= 2
                      ? `No results for “${query}”.`
                      : "Type to search pages and store records."}
                  </li>
                ) : (
                  <>
                    {navResults.length > 0 && (
                      <>
                        {query.trim().length > 0 && (
                          <li className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-green-700/45">
                            Pages
                          </li>
                        )}
                        {navResults.map((item) => {
                          const index = rows.findIndex((r) => r.kind === "nav" && r.item === item);
                          return (
                            <SearchResultButton
                              key={item.href}
                              row={{ kind: "nav", item }}
                              index={index}
                              activeIndex={activeIndex}
                              onGo={go}
                              onHover={setActiveIndex}
                            />
                          );
                        })}
                      </>
                    )}
                    {query.trim().length >= 2 && (entityLoading || entities.length > 0) && (
                      <>
                        <li className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-green-700/45">
                          {entityLoading ? "Searching…" : "Store records"}
                        </li>
                        {entityLoading && entities.length === 0 ? (
                          <li className="px-4 py-4 text-center text-sm text-green-700/50">Searching store records…</li>
                        ) : (
                          entities.map((item) => {
                            const index = rows.findIndex((r) => r.kind === "entity" && r.item.id === item.id);
                            return (
                              <SearchResultButton
                                key={`${item.type}-${item.id}`}
                                row={{ kind: "entity", item }}
                                index={index}
                                activeIndex={activeIndex}
                                onGo={go}
                                onHover={setActiveIndex}
                              />
                            );
                          })
                        )}
                      </>
                    )}
                  </>
                )}
              </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SearchResultButton({
  row,
  index,
  activeIndex,
  onGo,
  onHover,
}: {
  row: SearchRow;
  index: number;
  activeIndex: number;
  onGo: (row: SearchRow) => void;
  onHover: (index: number) => void;
}) {
  const disabled = row.kind === "nav" && row.item.soon;
  const icon =
    row.kind === "nav"
      ? row.item.icon
      : (ENTITY_ICONS[row.item.type] as Parameters<typeof Icon>[0]["name"]);
  const label = row.kind === "nav" ? row.item.label : row.item.label;
  const subtitle = row.kind === "entity" ? row.item.subtitle : undefined;

  return (
    <li role="option" aria-selected={index === activeIndex}>
      <button
        type="button"
        onClick={() => onGo(row)}
        onMouseEnter={() => onHover(index)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition-colors",
          disabled && "cursor-not-allowed opacity-60",
          index === activeIndex && !disabled ? "bg-green-50 text-green-900" : "text-green-800",
        )}
      >
        <span className="text-green-600">
          <Icon name={icon} size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{label}</span>
          {subtitle && <span className="block truncate text-xs text-green-700/55">{subtitle}</span>}
        </span>
        {row.kind === "nav" && row.item.soon && (
          <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700/60">
            Soon
          </span>
        )}
      </button>
    </li>
  );
}
