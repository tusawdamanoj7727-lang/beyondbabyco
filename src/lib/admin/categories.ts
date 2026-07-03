import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CatalogStatus } from "@/lib/supabase/database.types";

export const CATEGORY_SORTABLE_COLUMNS = [
  "name",
  "position",
  "status",
  "updated_at",
  "created_at",
] as const;
export type CategorySortColumn = (typeof CATEGORY_SORTABLE_COLUMNS)[number];

export interface CategoryListParams {
  search?: string;
  status?: CatalogStatus | "all";
  parentId?: string;
  featured?: boolean;
  sort?: CategorySortColumn;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
  trash?: boolean;
}

export interface CategoryListItem {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName: string | null;
  image: string | null;
  productCount: number;
  isFeatured: boolean;
  status: CatalogStatus;
  position: number;
  updatedAt: string;
}

export interface CategoryListResult {
  rows: CategoryListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface CategoryOption {
  id: string;
  name: string;
  parentId: string | null;
}

export interface CategoryEditData {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  iconUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  status: CatalogStatus;
  isFeatured: boolean;
  position: number;
  deletedAt: string | null;
}

export async function listCategories(
  params: CategoryListParams,
): Promise<CategoryListResult> {
  const supabase = await createSupabaseServerClient();

  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));
  const sort: CategorySortColumn = params.sort ?? "position";
  const ascending = params.dir ? params.dir === "asc" : sort === "position";
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("categories")
    .select(
      "id,name,slug,parent_id,image_url,is_featured,status,position,updated_at",
      { count: "exact" },
    );

  query = params.trash
    ? query.not("deleted_at", "is", null)
    : query.is("deleted_at", null);

  if (params.search && params.search.trim()) {
    const q = params.search.trim().replace(/[%,]/g, "");
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  }
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.parentId) query = query.eq("parent_id", params.parentId);
  if (params.featured) query = query.eq("is_featured", true);

  query = query.order(sort, { ascending }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const categories = data ?? [];
  const [parentMap, countMap] = await Promise.all([
    lookupCategoryNames(supabase, uniq(categories.map((c) => c.parent_id))),
    productCounts(supabase, "category_id", categories.map((c) => c.id)),
  ]);

  const rows: CategoryListItem[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parent_id,
    parentName: c.parent_id ? parentMap.get(c.parent_id) ?? null : null,
    image: c.image_url,
    productCount: countMap.get(c.id) ?? 0,
    isFeatured: c.is_featured,
    status: c.status,
    position: c.position,
    updatedAt: c.updated_at,
  }));

  const total = count ?? 0;
  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getCategoryForEdit(
  id: string,
): Promise<CategoryEditData | null> {
  const supabase = await createSupabaseServerClient();
  const { data: c, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!c) return null;

  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parent_id,
    description: c.description,
    imageUrl: c.image_url,
    bannerUrl: c.banner_url,
    iconUrl: c.icon_url,
    seoTitle: c.seo_title,
    seoDescription: c.seo_description,
    metaKeywords: c.meta_keywords,
    canonicalUrl: c.canonical_url,
    status: c.status,
    isFeatured: c.is_featured,
    position: c.position,
    deletedAt: c.deleted_at,
  };
}

/** All categories (id/name/parent) for parent selects + breadcrumb preview. */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("categories")
    .select("id,name,parent_id")
    .is("deleted_at", null)
    .order("position", { ascending: true });
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parent_id,
  }));
}

// ----------------------------- helpers -----------------------------

function uniq(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => !!v))];
}

async function lookupCategoryNames(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const { data } = await supabase.from("categories").select("id,name").in("id", ids);
  for (const row of data ?? []) map.set(row.id, row.name);
  return map;
}

/** Count non-deleted products grouped by a foreign-key column. */
export async function productCounts(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  column: "category_id" | "brand_id",
  ids: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  const { data } = await supabase
    .from("products")
    .select(column)
    .in(column, ids)
    .is("deleted_at", null);
  for (const row of (data ?? []) as Record<string, string | null>[]) {
    const key = row[column];
    if (key) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}
