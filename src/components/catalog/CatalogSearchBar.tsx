"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { MICROCOPY } from "@/lib/brand/copy";

type CatalogSearchBarProps = {
  /** Where search submits. Defaults to filtering /products in place. */
  actionPath?: "/products" | "/search";
  defaultValue?: string;
};

export default function CatalogSearchBar({
  actionPath = "/products",
  defaultValue = "",
}: CatalogSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("catalog-q") as HTMLInputElement;
    const q = input.value.trim();

    if (actionPath === "/search") {
      if (!q) return;
      router.push(`/search?q=${encodeURIComponent(q)}`);
      return;
    }

    const sp = new URLSearchParams(searchParams.toString());
    if (q) sp.set("q", q);
    else sp.delete("q");
    sp.delete("page");
    const qs = sp.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  }

  return (
    <form onSubmit={onSubmit} className="collection-search mb-8" role="search">
      <label htmlFor="catalog-q" className="sr-only">
        Search products
      </label>
      <Search className="collection-search-icon h-4 w-4" aria-hidden="true" />
      <input
        id="catalog-q"
        name="catalog-q"
        type="search"
        placeholder={MICROCOPY.search.placeholder}
        autoComplete="off"
        defaultValue={defaultValue || searchParams.get("q") || ""}
        enterKeyHint="search"
      />
    </form>
  );
}
