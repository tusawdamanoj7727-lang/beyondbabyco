import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductStatus } from "@/lib/supabase/database.types";

export const SORTABLE_COLUMNS = [
  "name",
  "price",
  "stock",
  "status",
  "updated_at",
  "created_at",
] as const;
export type SortColumn = (typeof SORTABLE_COLUMNS)[number];

export interface ProductListParams {
  search?: string;
  status?: ProductStatus | "all";
  brandId?: string;
  categoryId?: string;
  featured?: boolean;
  sort?: SortColumn;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
  /** When true, list only soft-deleted products (trash view). */
  trash?: boolean;
}

export interface ProductListItem {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  salePrice: number | null;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  status: ProductStatus;
  isFeatured: boolean;
  updatedAt: string;
  brandName: string | null;
  categoryName: string | null;
  thumbnail: string | null;
}

export interface ProductListResult {
  rows: ProductListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface FormOption {
  id: string;
  name: string;
}

export interface SubcategoryOption extends FormOption {
  categoryId: string;
}

export interface ProductFormOptions {
  brands: FormOption[];
  categories: FormOption[];
  subcategories: SubcategoryOption[];
  ingredients: FormOption[];
  benefits: FormOption[];
}

export interface ProductImageRecord {
  id: string;
  url: string;
  alt: string | null;
  position: number;
  isPrimary: boolean;
}

export interface ProductEditData {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  barcode: string | null;
  brandId: string | null;
  categoryId: string | null;
  subcategoryId: string | null;
  shortDescription: string | null;
  description: string | null;
  status: ProductStatus;
  price: number;
  compareAtPrice: number | null;
  salePrice: number | null;
  gstRate: number;
  taxClass: string | null;
  stock: number;
  lowStockThreshold: number;
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isTrending: boolean;
  launchDate: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  deletedAt: string | null;
  ingredientIds: string[];
  benefitIds: string[];
  images: ProductImageRecord[];
}

export async function listProducts(
  params: ProductListParams,
): Promise<ProductListResult> {
  const supabase = await createSupabaseServerClient();

  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));
  const sort: SortColumn = params.sort ?? "updated_at";
  const ascending = params.dir === "asc";
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("products")
    .select(
      "id,name,sku,price,sale_price,compare_at_price,stock,low_stock_threshold,status,is_featured,updated_at,brand_id,category_id",
      { count: "exact" },
    );

  query = params.trash
    ? query.not("deleted_at", "is", null)
    : query.is("deleted_at", null);

  if (params.search && params.search.trim()) {
    const q = params.search.trim().replace(/[%,]/g, "");
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.brandId) query = query.eq("brand_id", params.brandId);
  if (params.categoryId) query = query.eq("category_id", params.categoryId);
  if (params.featured) query = query.eq("is_featured", true);

  query = query.order(sort, { ascending }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const products = data ?? [];
  const ids = products.map((p) => p.id);

  // Resolve brand / category names + primary thumbnails via lookups
  // (avoids fragile embedded-select typing).
  const [brandMap, categoryMap, thumbMap] = await Promise.all([
    lookupNames(supabase, "brands", uniq(products.map((p) => p.brand_id))),
    lookupNames(supabase, "categories", uniq(products.map((p) => p.category_id))),
    primaryThumbnails(supabase, ids),
  ]);

  const rows: ProductListItem[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price,
    salePrice: p.sale_price,
    compareAtPrice: p.compare_at_price,
    stock: p.stock,
    lowStockThreshold: p.low_stock_threshold,
    status: p.status,
    isFeatured: p.is_featured,
    updatedAt: p.updated_at,
    brandName: p.brand_id ? brandMap.get(p.brand_id) ?? null : null,
    categoryName: p.category_id ? categoryMap.get(p.category_id) ?? null : null,
    thumbnail: thumbMap.get(p.id) ?? null,
  }));

  const total = count ?? 0;
  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getProductForEdit(
  id: string,
): Promise<ProductEditData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: p, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!p) return null;

  const [imagesRes, ingRes, benRes] = await Promise.all([
    supabase
      .from("product_images")
      .select("id,url,alt,position,is_primary")
      .eq("product_id", id)
      .order("position", { ascending: true }),
    supabase.from("product_ingredients").select("ingredient_id").eq("product_id", id),
    supabase.from("product_benefits").select("benefit_id").eq("product_id", id),
  ]);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    barcode: p.barcode,
    brandId: p.brand_id,
    categoryId: p.category_id,
    subcategoryId: p.subcategory_id,
    shortDescription: p.short_description,
    description: p.description,
    status: p.status,
    price: p.price,
    compareAtPrice: p.compare_at_price,
    salePrice: p.sale_price,
    gstRate: p.gst_rate,
    taxClass: p.tax_class,
    stock: p.stock,
    lowStockThreshold: p.low_stock_threshold,
    weightGrams: p.weight_grams,
    lengthCm: p.length_cm,
    widthCm: p.width_cm,
    heightCm: p.height_cm,
    isFeatured: p.is_featured,
    isBestSeller: p.is_best_seller,
    isNewArrival: p.is_new_arrival,
    isTrending: p.is_trending,
    launchDate: p.launch_date,
    seoTitle: p.seo_title,
    seoDescription: p.seo_description,
    metaKeywords: p.meta_keywords,
    canonicalUrl: p.canonical_url,
    deletedAt: p.deleted_at,
    ingredientIds: (ingRes.data ?? []).map((r) => r.ingredient_id),
    benefitIds: (benRes.data ?? []).map((r) => r.benefit_id),
    images: (imagesRes.data ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      position: img.position,
      isPrimary: img.is_primary,
    })),
  };
}

export async function getProductFormOptions(): Promise<ProductFormOptions> {
  const supabase = await createSupabaseServerClient();

  const [brands, categories, subcategories, ingredients, benefits] =
    await Promise.all([
      supabase.from("brands").select("id,name").order("name"),
      supabase.from("categories").select("id,name").order("position"),
      supabase.from("subcategories").select("id,name,category_id").order("position"),
      supabase.from("ingredients").select("id,name").order("name"),
      supabase.from("benefits").select("id,name").order("name"),
    ]);

  return {
    brands: brands.data ?? [],
    categories: categories.data ?? [],
    subcategories: (subcategories.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      categoryId: s.category_id,
    })),
    ingredients: ingredients.data ?? [],
    benefits: benefits.data ?? [],
  };
}

// ----------------------------- helpers -----------------------------

function uniq(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => !!v))];
}

async function lookupNames(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: "brands" | "categories",
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const { data } = await supabase.from(table).select("id,name").in("id", ids);
  for (const row of data ?? []) map.set(row.id, row.name);
  return map;
}

async function primaryThumbnails(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  productIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (productIds.length === 0) return map;
  const { data } = await supabase
    .from("product_images")
    .select("product_id,url,position,is_primary")
    .in("product_id", productIds)
    .order("position", { ascending: true });

  for (const img of data ?? []) {
    if (!map.has(img.product_id) || img.is_primary) {
      map.set(img.product_id, img.url);
    }
  }
  return map;
}
