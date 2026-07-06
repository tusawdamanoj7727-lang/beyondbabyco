import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productCounts } from "./categories";
import type { CatalogStatus } from "@/lib/supabase/database.types";

export const BRAND_SORTABLE_COLUMNS = [
  "name",
  "position",
  "status",
  "updated_at",
  "created_at",
] as const;
export type BrandSortColumn = (typeof BRAND_SORTABLE_COLUMNS)[number];

export interface BrandListParams {
  search?: string;
  status?: CatalogStatus | "all";
  featured?: boolean;
  sort?: BrandSortColumn;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
  trash?: boolean;
}

export interface BrandListItem {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
  productCount: number;
  isFeatured: boolean;
  status: CatalogStatus;
  position: number;
  updatedAt: string;
}

export interface BrandListResult {
  rows: BrandListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface BrandEditData {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  description: string | null;
  countryOfOrigin: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  status: CatalogStatus;
  isFeatured: boolean;
  position: number;
  deletedAt: string | null;
}

export async function listBrands(
  params: BrandListParams,
): Promise<BrandListResult> {
  const supabase = await createSupabaseServerClient();

  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));
  const sort: BrandSortColumn = params.sort ?? "position";
  const ascending = params.dir ? params.dir === "asc" : sort === "position";
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("brands")
    .select(
      "id,name,slug,logo_url,website_url,is_featured,status,position,updated_at",
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
  if (params.featured) query = query.eq("is_featured", true);

  query = query.order(sort, { ascending }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const brands = data ?? [];
  const countMap = await productCounts(supabase, "brand_id", brands.map((b) => b.id));

  const rows: BrandListItem[] = brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: b.logo_url,
    website: b.website_url,
    productCount: countMap.get(b.id) ?? 0,
    isFeatured: b.is_featured,
    status: b.status as CatalogStatus,
    position: b.position,
    updatedAt: b.updated_at,
  }));

  const total = count ?? 0;
  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getBrandForEdit(id: string): Promise<BrandEditData | null> {
  const supabase = await createSupabaseServerClient();
  const { data: b, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!b) return null;

  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    websiteUrl: b.website_url,
    description: b.description,
    countryOfOrigin: b.country_of_origin,
    logoUrl: b.logo_url,
    bannerUrl: b.banner_url,
    seoTitle: b.seo_title,
    seoDescription: b.seo_description,
    metaKeywords: b.meta_keywords,
    canonicalUrl: b.canonical_url,
    status: b.status as CatalogStatus,
    isFeatured: b.is_featured,
    position: b.position,
    deletedAt: b.deleted_at,
  };
}
