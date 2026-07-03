"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { catalogParamsToSearchParams, parseCatalogParams } from "@/lib/catalog/params";
import type { CatalogFilterOptions } from "@/lib/catalog/types";
import { focusRing } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function CategoryChips({ filters }: { filters: CatalogFilterOptions }) {
  const searchParams = useSearchParams();
  const params = useMemo(
    () => parseCatalogParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );

  const chips = [
    { key: "all", label: "All", href: "/products", active: !params.category && !params.age && !params.type },
    ...filters.ageGroups.map((age) => ({
      key: `age-${age.slug}`,
      label: age.name,
      href: `/products?${catalogParamsToSearchParams({ age: age.slug, page: 1 }).toString()}`,
      active: params.age === age.slug,
    })),
    ...filters.productTypes.slice(0, 8).map((type) => ({
      key: `type-${type.slug}`,
      label: type.name,
      href: `/products?${catalogParamsToSearchParams({ type: type.slug, page: 1 }).toString()}`,
      active: params.type === type.slug,
    })),
  ];

  return (
    <nav aria-label="Browse by category" className="collection-chip-rail">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          aria-current={chip.active ? "page" : undefined}
          data-active={chip.active ? "true" : "false"}
          className={cn("collection-chip", focusRing)}
        >
          {chip.label}
        </Link>
      ))}
    </nav>
  );
}
