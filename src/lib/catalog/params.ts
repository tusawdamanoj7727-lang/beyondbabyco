import type { CatalogSearchParams, StorefrontSort } from "./types";

const SORT_VALUES: StorefrontSort[] = [
  "featured",
  "newest",
  "price_asc",
  "price_desc",
  "best_selling",
  "rating",
];

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseBool(value: string | undefined): boolean | undefined {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return undefined;
}

export function parseCatalogParams(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogSearchParams {
  const get = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v : undefined;
  };

  const sortRaw = get("sort");
  const sort = SORT_VALUES.includes(sortRaw as StorefrontSort)
    ? (sortRaw as StorefrontSort)
    : "featured";

  return {
    q: get("q")?.trim() || undefined,
    category: get("category") || undefined,
    brand: get("brand") || undefined,
    age: get("age") || undefined,
    type: get("type") || undefined,
    minPrice: parseNumber(get("minPrice")),
    maxPrice: parseNumber(get("maxPrice")),
    inStock: parseBool(get("inStock")),
    minRating: parseNumber(get("minRating")),
    sort,
    page: Math.max(1, parseNumber(get("page")) ?? 1),
  };
}

export function catalogParamsToSearchParams(params: CatalogSearchParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category) sp.set("category", params.category);
  if (params.brand) sp.set("brand", params.brand);
  if (params.age) sp.set("age", params.age);
  if (params.type) sp.set("type", params.type);
  if (params.minPrice != null) sp.set("minPrice", String(params.minPrice));
  if (params.maxPrice != null) sp.set("maxPrice", String(params.maxPrice));
  if (params.inStock) sp.set("inStock", "1");
  if (params.minRating != null) sp.set("minRating", String(params.minRating));
  if (params.sort && params.sort !== "featured") sp.set("sort", params.sort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  return sp;
}
