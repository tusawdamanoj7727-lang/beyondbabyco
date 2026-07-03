"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { MICROCOPY } from "@/lib/brand/copy";

export default function CatalogSearchBar() {
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("catalog-q") as HTMLInputElement;
    const q = input.value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
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
      />
    </form>
  );
}
