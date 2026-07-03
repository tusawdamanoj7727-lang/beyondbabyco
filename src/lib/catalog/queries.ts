import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Reusable, frontend-facing catalog queries.
 *
 * These power the storefront surfaces that will be built later — homepage,
 * primary navigation, product listing pages (PLP) and search. They only ever
 * return *published* (status = 'active'), non-deleted records ordered by the
 * `position` field configured in the admin.
 */

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  banner: string | null;
  isFeatured: boolean;
  position: number;
  children: CategoryNode[];
}

export interface PublicBrand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  banner: string | null;
  website: string | null;
  isFeatured: boolean;
  position: number;
}

/**
 * Full, unlimited-depth category tree of published categories.
 * Children are nested under their parent and ordered by `position`.
 */
export async function getCategoriesTree(): Promise<CategoryNode[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select(
      "id,name,slug,description,image_url,icon_url,banner_url,is_featured,position,parent_id",
    )
    .eq("status", "active")
    .is("deleted_at", null)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);

  const nodes = new Map<string, CategoryNode>();
  const rows = data ?? [];
  for (const c of rows) {
    nodes.set(c.id, {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image_url,
      icon: c.icon_url,
      banner: c.banner_url,
      isFeatured: c.is_featured,
      position: c.position,
      children: [],
    });
  }

  const roots: CategoryNode[] = [];
  for (const c of rows) {
    const node = nodes.get(c.id)!;
    const parent = c.parent_id ? nodes.get(c.parent_id) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** Published categories flagged as featured (homepage / nav highlights). */
export async function getFeaturedCategories(limit = 12): Promise<CategoryNode[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,image_url,icon_url,banner_url,is_featured,position")
    .eq("status", "active")
    .eq("is_featured", true)
    .is("deleted_at", null)
    .order("position", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image_url,
    icon: c.icon_url,
    banner: c.banner_url,
    isFeatured: c.is_featured,
    position: c.position,
    children: [],
  }));
}

/** All published brands, ordered for display. */
export async function getBrands(): Promise<PublicBrand[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id,name,slug,logo_url,banner_url,website_url,is_featured,position")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toPublicBrand);
}

/** Published brands flagged as featured. */
export async function getFeaturedBrands(limit = 12): Promise<PublicBrand[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id,name,slug,logo_url,banner_url,website_url,is_featured,position")
    .eq("status", "active")
    .eq("is_featured", true)
    .is("deleted_at", null)
    .order("position", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map(toPublicBrand);
}

/** Published products by id (homepage CMS order preserved). */
export async function getProductsByIds(ids: string[]): Promise<PublicProduct[]> {
  if (ids.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,slug,name,short_description,price,sale_price,status,is_featured,is_best_seller,is_new_arrival,category_id",
    )
    .in("id", ids)
    .in("status", ["active", "coming_soon"])
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return mapPublicProducts(data ?? [], ids);
}

/** Featured active products for the storefront. */
export async function getFeaturedProducts(limit = 8): Promise<PublicProduct[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,slug,name,short_description,price,sale_price,status,is_featured,is_best_seller,is_new_arrival,category_id",
    )
    .eq("is_featured", true)
    .in("status", ["active", "coming_soon"])
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return mapPublicProducts(
    data ?? [],
    (data ?? []).map((r) => r.id),
  );
}

/** Published categories by id (homepage CMS order preserved). */
export async function getCategoriesByIds(ids: string[]): Promise<CategoryNode[]> {
  if (ids.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,image_url,icon_url,banner_url,is_featured,position")
    .in("id", ids)
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  const byId = new Map<string, CategoryNode>();
  for (const c of data ?? []) {
    byId.set(c.id, {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image_url,
      icon: c.icon_url,
      banner: c.banner_url,
      isFeatured: c.is_featured,
      position: c.position,
      children: [],
    });
  }
  return ids.map((id) => byId.get(id)).filter((c): c is CategoryNode => c !== undefined);
}

export interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  status: string;
  categoryName: string | null;
  imageUrl: string | null;
  isBestSeller: boolean;
  isNewArrival: boolean;
}

function toPublicProduct(row: {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  price: number;
  sale_price: number | null;
  status: string;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  category_id: string | null;
  categoryName?: string | null;
  imageUrl?: string | null;
}): PublicProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    price: row.price,
    salePrice: row.sale_price,
    status: row.status,
    categoryName: row.categoryName ?? null,
    imageUrl: row.imageUrl ?? null,
    isBestSeller: row.is_best_seller,
    isNewArrival: row.is_new_arrival,
  };
}

async function mapPublicProducts(
  rows: {
    id: string;
    slug: string;
    name: string;
    short_description: string | null;
    price: number;
    sale_price: number | null;
    status: string;
    is_best_seller: boolean;
    is_new_arrival: boolean;
    category_id: string | null;
  }[],
  order: string[],
): Promise<PublicProduct[]> {
  if (rows.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const productIds = rows.map((r) => r.id);
  const categoryIds = [...new Set(rows.map((r) => r.category_id).filter(Boolean))] as string[];

  const [categoriesRes, imagesRes] = await Promise.all([
    categoryIds.length
      ? supabase.from("categories").select("id,name").in("id", categoryIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase
      .from("product_images")
      .select("product_id,url,is_primary,position")
      .in("product_id", productIds)
      .order("position", { ascending: true }),
  ]);

  const categoryMap = new Map((categoriesRes.data ?? []).map((c) => [c.id, c.name]));
  const imageMap = new Map<string, string>();
  for (const img of imagesRes.data ?? []) {
    if (!imageMap.has(img.product_id) || img.is_primary) {
      imageMap.set(img.product_id, img.url);
    }
  }

  const byId = new Map(
    rows.map((row) => [
      row.id,
      toPublicProduct({
        ...row,
        categoryName: row.category_id ? categoryMap.get(row.category_id) ?? null : null,
        imageUrl: imageMap.get(row.id) ?? null,
      }),
    ]),
  );

  return order.map((id) => byId.get(id)).filter((p): p is PublicProduct => !!p);
}

function toPublicBrand(b: {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  website_url: string | null;
  is_featured: boolean;
  position: number;
}): PublicBrand {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: b.logo_url,
    banner: b.banner_url,
    website: b.website_url,
    isFeatured: b.is_featured,
    position: b.position,
  };
}
