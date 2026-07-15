import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

import { cache } from "react";
import { unstable_cache } from "next/cache";

import { PRODUCTS_PAGE } from "@/lib/brand/copy";
import { resolveProductGalleryImages, resolveProductVisual } from "@/lib/brand/generated-assets";
import { getHero } from "@/lib/homepage/queries";
import { createSupabasePublicClient } from "@/lib/supabase/public";

import { LAUNCH_PRODUCT_SLUGS } from "./availability";
import { mapRowToStorefrontProduct } from "./format";
import {
  logProductLoadFailure,
  logProductLoadSuccess,
  supabaseErrorBody,
} from "./product-load-log";
import { resolveSevenProductImage } from "./product-images";
import { getSevenProductContent } from "./seven-product-content";
import {
  getVariantAvailableStock,
  resolveStorefrontAvailability,
} from "@/lib/inventory/storefront-stock";
import type {
  CatalogBanner,
  CatalogFilterOptions,
  CatalogListResult,
  CatalogSearchParams,
  StorefrontBenefit,
  StorefrontFaq,
  StorefrontIngredient,
  StorefrontProduct,
  StorefrontProductDetail,
  StorefrontVariant,
} from "./types";

const PRODUCT_SELECT =
  "id,slug,name,short_description,description,price,compare_at_price,sale_price,status,stock,gst_rate,rating_avg,rating_count,category_id,subcategory_id,brand_id,is_featured,is_best_seller,is_new_arrival,is_trending,sku,seo_title,seo_description,created_at,launch_date";

const PER_PAGE = 12;
const CATALOG_REVALIDATE_SEC = 60;

/** Public catalog client — no request cookies → ISR / unstable_cache friendly. */
function catalogClient() {
  return createSupabasePublicClient();
}

export const listStorefrontProducts = cache(
  async (params: CatalogSearchParams): Promise<CatalogListResult> => {
    const supabase = catalogClient();
    const page = params.page ?? 1;
    const from = (page - 1) * PER_PAGE;
    const to = from + PER_PAGE - 1;

    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT, { count: "exact" })
      .in("status", ["active", "coming_soon"])
      .is("deleted_at", null);

    if (params.q?.trim()) {
      const q = params.q.trim().replace(/[%,]/g, "");
      query = query.or(
        `name.ilike.%${q}%,short_description.ilike.%${q}%,description.ilike.%${q}%`,
      );
    }

    if (params.category) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", params.category)
        .maybeSingle();
      if (cat) query = query.eq("category_id", cat.id);
    }

    if (params.age) {
      const { data: ageCat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", params.age)
        .is("parent_id", null)
        .maybeSingle();
      if (ageCat) {
        const { data: children } = await supabase
          .from("categories")
          .select("id")
          .eq("parent_id", ageCat.id);
        const ids = [ageCat.id, ...(children ?? []).map((c) => c.id)];
        query = query.in("category_id", ids);
      }
    }

    if (params.type) {
      const { data: sub } = await supabase
        .from("subcategories")
        .select("id")
        .eq("slug", params.type)
        .maybeSingle();
      if (sub) query = query.eq("subcategory_id", sub.id);
    }

    if (params.brand) {
      const { data: brand } = await supabase
        .from("brands")
        .select("id")
        .eq("slug", params.brand)
        .maybeSingle();
      if (brand) query = query.eq("brand_id", brand.id);
    }

    if (params.inStock) {
      query = query.eq("status", "active").gt("stock", 0);
    }

    if (params.minRating != null && params.minRating > 0) {
      query = query.gte("rating_avg", params.minRating);
    }

    const sort = params.sort ?? "featured";
    switch (sort) {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "best_selling":
        query = query.order("is_best_seller", { ascending: false }).order("rating_count", { ascending: false });
        break;
      case "rating":
        query = query.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false });
        break;
      case "featured":
      default:
        query = query.order("is_featured", { ascending: false }).order("updated_at", { ascending: false });
        break;
    }

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    let rows = data ?? [];

    if (params.minPrice != null || params.maxPrice != null) {
      rows = rows.filter((row) => {
        const effective = row.sale_price != null && row.sale_price > 0 ? row.sale_price : row.price;
        if (params.minPrice != null && effective < params.minPrice) return false;
        if (params.maxPrice != null && effective > params.maxPrice) return false;
        return true;
      });
    }

    const products = await enrichStorefrontProducts(rows);
    const total = count ?? products.length;

    return {
      products,
      total,
      page,
      perPage: PER_PAGE,
      pageCount: Math.max(1, Math.ceil(total / PER_PAGE)),
    };
  },
);

export const searchStorefrontProducts = cache(
  async (query: string, limit = 8): Promise<StorefrontProduct[]> => {
    const result = await listStorefrontProducts({ q: query, sort: "featured", page: 1 });
    return result.products.slice(0, limit);
  },
);

export const getProductBySlug = cache(
  async (slug: string): Promise<StorefrontProductDetail | null> => {
    return getCachedProductBySlug(slug);
  },
);

async function loadProductBySlug(slug: string): Promise<StorefrontProductDetail | null> {
    const supabase = catalogClient();
    const mainQuery =
      "products.select(PRODUCT_SELECT).eq(slug).in(status,active|coming_soon).is(deleted_at,null).maybeSingle()";

    const { data: row, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .in("status", ["active", "coming_soon"])
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      logProductLoadFailure({
        slug,
        query: mainQuery,
        httpStatus: (error as { status?: number }).status,
        responseBody: supabaseErrorBody(error),
        returnedData: row,
        errorMessage: error.message,
      });
      throw new Error(error.message);
    }
    if (!row) return null;

    const [enriched, imagesRes, ingLinksRes, benLinksRes, varRes, faqsRes] = await Promise.all([
      enrichStorefrontProducts([row]),
      supabase
        .from("product_images")
        .select("id,url,alt,is_primary,position")
        .eq("product_id", row.id)
        .order("position", { ascending: true }),
      supabase
        .from("product_ingredients")
        .select("ingredient_id,notes")
        .eq("product_id", row.id),
      supabase
        .from("product_benefits")
        .select("benefit_id")
        .eq("product_id", row.id),
      supabase
        .from("product_variants")
        .select("id,name,sku,price,compare_at_price,is_active,position")
        .eq("product_id", row.id)
        .eq("is_active", true)
        .order("position", { ascending: true }),
      fetchPublishedFaqs(supabase),
    ]);

    const base = enriched[0];
    if (!base) return null;

    const ingredientIds = (ingLinksRes.data ?? []).map((r) => r.ingredient_id);
    const benefitIds = (benLinksRes.data ?? []).map((r) => r.benefit_id);

    const [ingredientsRes, benefitsRes] = await Promise.all([
      ingredientIds.length
        ? supabase
            .from("ingredients")
            .select("id,name,inci_name,description")
            .in("id", ingredientIds)
        : Promise.resolve({ data: [] as { id: string; name: string; inci_name: string | null; description: string | null }[] }),
      benefitIds.length
        ? supabase.from("benefits").select("id,name,icon,description").in("id", benefitIds)
        : Promise.resolve({ data: [] as { id: string; name: string; icon: string | null; description: string | null }[] }),
    ]);

    const notesByIngredient = new Map(
      (ingLinksRes.data ?? []).map((link) => [link.ingredient_id, link.notes]),
    );

    const ingredients: StorefrontIngredient[] = (ingredientsRes.data ?? []).map((ing) => ({
      id: ing.id,
      name: ing.name,
      inciName: ing.inci_name,
      description: ing.description,
      notes: notesByIngredient.get(ing.id) ?? null,
    }));

    const benefits: StorefrontBenefit[] = (benefitsRes.data ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      icon: b.icon,
      description: b.description,
    }));

    const variants: StorefrontVariant[] = (varRes.data ?? [])
      .map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price ?? base.price,
        compareAtPrice: v.compare_at_price,
        isActive: v.is_active,
        stockQuantity: 0,
      }))
      .filter((v) => v.price > 0 && v.isActive);

    const variantStock = await getVariantAvailableStock(variants.map((v) => v.id));
    for (const variant of variants) {
      variant.stockQuantity = variantStock.get(variant.id) ?? 0;
    }

    const availability = resolveStorefrontAvailability({
      slug,
      status: base.status,
      productStock: row.stock,
      variantStocks: variants.map((v) => v.stockQuantity),
    });

    const totalAvailable = variants.reduce((sum, v) => sum + v.stockQuantity, 0);
    const inStock = availability.inStock;

    const faqs: StorefrontFaq[] = faqsRes;

    const fallbackContent = getSevenProductContent(slug);
    const mergedBenefits: StorefrontBenefit[] =
      benefits.length > 0
        ? benefits
        : (fallbackContent?.benefits.map((b, index) => ({
            id: `seven-benefit-${slug}-${index}`,
            name: b.name,
            icon: b.icon,
            description: b.description,
          })) ?? []);
    const mergedFaqs: StorefrontFaq[] =
      faqs.length > 0
        ? faqs
        : (fallbackContent?.faqs.map((f, index) => ({
            id: `seven-faq-${slug}-${index}`,
            question: f.question,
            answer: f.answer,
          })) ?? []);
    const mergedDescription =
      fallbackContent?.directions && (!row.description || row.description.length < 120)
        ? `${row.description ?? base.shortDescription ?? ""}\n\n${fallbackContent.directions}`.trim()
        : row.description;

    const imageRows = imagesRes.data ?? [];
    const blurMap = await fetchBlurMapByUrls(
      supabase,
      imageRows.map((img) => img.url),
    );

    const categorySlug = base.categorySlug;
    const resolvedGallery = resolveProductGalleryImages(
      slug,
      categorySlug,
      imageRows.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        isPrimary: img.is_primary,
        blurDataUrl: blurMap.get(img.url) ?? null,
      })),
    );

    const cardVisual = resolveProductVisual({
      slug,
      categorySlug,
      imageUrl: base.imageUrl,
      imageBlurDataUrl: base.imageBlurDataUrl,
    });

    logProductLoadSuccess(slug, base.id);

    return {
      ...base,
      stock: totalAvailable,
      inStock,
      imageUrl: cardVisual.imageUrl,
      imageBlurDataUrl: cardVisual.imageBlurDataUrl,
      description: mergedDescription,
      sku: row.sku,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      images: resolvedGallery,
      ingredients,
      benefits: mergedBenefits,
      variants,
      faqs: mergedFaqs,
    };
}

const getCachedProductBySlug = unstable_cache(
  async (slug: string) => loadProductBySlug(slug),
  ["storefront-product-by-slug"],
  { revalidate: CATALOG_REVALIDATE_SEC, tags: ["catalog"] },
);

export const getRelatedProducts = cache(
  async (productId: string, categoryId: string | null, limit = 4): Promise<StorefrontProduct[]> => {
    const supabase = catalogClient();

    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .in("status", ["active", "coming_soon"])
      .is("deleted_at", null)
      .neq("id", productId)
      .order("is_featured", { ascending: false })
      .limit(limit);

    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query;
    if (error) {
      logProductLoadFailure({
        slug: `related:${productId}`,
        query: "products.select(PRODUCT_SELECT).related",
        responseBody: supabaseErrorBody(error),
        returnedData: data,
        errorMessage: error.message,
      });
      throw new Error(error.message);
    }
    return enrichStorefrontProducts(data ?? []);
  },
);

export const getCatalogFilterOptions = cache(async (): Promise<CatalogFilterOptions> => {
  const supabase = catalogClient();

  const [categoriesRes, subcategoriesRes, brandsRes, priceRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,slug,parent_id")
      .eq("status", "active")
      .is("deleted_at", null)
      .order("position", { ascending: true }),
    supabase
      .from("subcategories")
      .select("id,name,slug,category_id")
      .eq("is_active", true)
      .order("position", { ascending: true }),
    supabase
      .from("brands")
      .select("id,name,slug")
      .eq("status", "active")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("products")
      .select("price,sale_price")
      .in("status", ["active", "coming_soon"])
      .is("deleted_at", null),
  ]);

  const categories = (categoriesRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  const ageGroups = (categoriesRes.data ?? [])
    .filter((c) => !c.parent_id)
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  const productTypes = (subcategoriesRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    categoryId: s.category_id,
  }));

  const brands = (brandsRes.data ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
  }));

  const prices = (priceRes.data ?? []).map((p) =>
    p.sale_price != null && p.sale_price > 0 ? p.sale_price : p.price,
  );

  return {
    categories,
    ageGroups,
    productTypes,
    brands,
    priceRange: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 5000,
    },
  };
});

export const getCatalogBanner = cache(async (): Promise<CatalogBanner> => {
  const heroSlides = await getHero();
  const hero = heroSlides[0];

  return {
    title: PRODUCTS_PAGE.heroTitle,
    subtitle: PRODUCTS_PAGE.heroEyebrow,
    description: PRODUCTS_PAGE.heroDescription,
    imageUrl: hero?.backgroundUrl || hero?.imageUrl || null,
  };
});

async function fetchBlurMapByUrls(
  supabase: SupabaseClient<Database>,
  urls: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(urls.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data } = await supabase.from("media_library").select("url, blur_data_url").in("url", unique);
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.url && row.blur_data_url) map.set(row.url, row.blur_data_url);
  }
  return map;
}

async function enrichStorefrontProducts(
  rows: {
    id: string;
    slug: string;
    name: string;
    short_description: string | null;
    price: number;
    compare_at_price: number | null;
    sale_price: number | null;
    status: string;
    stock: number;
    gst_rate?: number;
    rating_avg: number;
    rating_count: number;
    category_id: string | null;
    subcategory_id: string | null;
    brand_id: string | null;
    is_featured: boolean;
    is_best_seller: boolean;
    is_new_arrival: boolean;
  }[],
): Promise<StorefrontProduct[]> {
  if (rows.length === 0) return [];

  const supabase = catalogClient();
  const productIds = rows.map((r) => r.id);
  const categoryIds = [...new Set(rows.map((r) => r.category_id).filter(Boolean))] as string[];
  const subcategoryIds = [...new Set(rows.map((r) => r.subcategory_id).filter(Boolean))] as string[];
  const brandIds = [...new Set(rows.map((r) => r.brand_id).filter(Boolean))] as string[];

  const [categoriesRes, subcategoriesRes, brandsRes, imagesRes, allCategoriesRes] = await Promise.all([
    categoryIds.length
      ? supabase.from("categories").select("id,name,slug,parent_id").in("id", categoryIds)
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string; parent_id: string | null }[] }),
    subcategoryIds.length
      ? supabase.from("subcategories").select("id,name").in("id", subcategoryIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    brandIds.length
      ? supabase.from("brands").select("id,name,slug").in("id", brandIds)
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
    supabase
      .from("product_images")
      .select("product_id,url,is_primary,position")
      .in("product_id", productIds)
      .order("position", { ascending: true }),
    supabase
      .from("categories")
      .select("id,name,slug")
      .eq("status", "active")
      .is("deleted_at", null),
  ]);

  const categoryRows = categoriesRes.data ?? [];
  const parentIds = [...new Set(categoryRows.map((c) => c.parent_id).filter(Boolean))] as string[];
  const parentMap = new Map<string, { name: string; slug: string }>();
  for (const c of allCategoriesRes.data ?? []) {
    if (parentIds.includes(c.id)) {
      parentMap.set(c.id, { name: c.name, slug: c.slug });
    }
  }

  const categoryDetailMap = new Map(
    categoryRows.map((c) => {
      const parent = c.parent_id ? parentMap.get(c.parent_id) : null;
      return [
        c.id,
        {
          name: c.name,
          slug: c.slug,
          ageGroupName: parent?.name ?? c.name,
          ageGroupSlug: parent?.slug ?? c.slug,
        },
      ];
    }),
  );
  const subcategoryMap = new Map((subcategoriesRes.data ?? []).map((c) => [c.id, c.name]));
  const brandMap = new Map((brandsRes.data ?? []).map((b) => [b.id, b]));
  const imageMap = new Map<string, string>();
  for (const img of imagesRes.data ?? []) {
    if (!imageMap.has(img.product_id) || img.is_primary) {
      imageMap.set(img.product_id, img.url);
    }
  }

  const blurMap = await fetchBlurMapByUrls(
    supabase,
    [...imageMap.values()],
  );

  const { data: variantRows } = await supabase
    .from("product_variants")
    .select("id, product_id")
    .in("product_id", productIds)
    .eq("is_active", true);

  const variantsByProduct = new Map<string, string[]>();
  for (const variant of variantRows ?? []) {
    const list = variantsByProduct.get(variant.product_id) ?? [];
    list.push(variant.id);
    variantsByProduct.set(variant.product_id, list);
  }

  const allVariantIds = (variantRows ?? []).map((v) => v.id);
  const variantStockMap = await getVariantAvailableStock(allVariantIds);

  return rows.map((row) => {
    const cat = row.category_id ? categoryDetailMap.get(row.category_id) : null;
    const brand = row.brand_id ? brandMap.get(row.brand_id) : null;
    const imageUrl = imageMap.get(row.id) ?? null;
    const categorySlug = cat?.slug ?? null;
    const resolved = resolveProductVisual({
      slug: row.slug,
      categorySlug,
      imageUrl,
      imageBlurDataUrl: imageUrl ? blurMap.get(imageUrl) ?? null : null,
    });
    const variantIds = variantsByProduct.get(row.id) ?? [];
    const variantStocks = variantIds.map((id) => variantStockMap.get(id) ?? 0);
    const { inStock, totalStock } = resolveStorefrontAvailability({
      slug: row.slug,
      status: row.status,
      productStock: row.stock,
      variantStocks,
    });

    const product = mapRowToStorefrontProduct(row, {
      categoryName: cat?.name ?? null,
      categorySlug,
      ageGroupName: cat?.ageGroupName ?? null,
      ageGroupSlug: cat?.ageGroupSlug ?? null,
      subcategoryName: row.subcategory_id ? subcategoryMap.get(row.subcategory_id) ?? null : null,
      brandName: brand?.name ?? null,
      brandSlug: brand?.slug ?? null,
      imageUrl: resolved.imageUrl,
      imageBlurDataUrl: resolved.imageBlurDataUrl,
    });

    return { ...product, inStock, stock: totalStock || product.stock };
  });
}

export const getFeaturedStorefrontProducts = cache(async (limit = 4): Promise<StorefrontProduct[]> => {
  const supabase = catalogClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_featured", true)
    .in("status", ["active", "coming_soon"])
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return enrichStorefrontProducts(data ?? []);
});

export async function getStorefrontProductsBySlugs(slugs: string[]): Promise<StorefrontProduct[]> {
  if (slugs.length === 0) return [];

  const supabase = catalogClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("slug", slugs)
    .in("status", ["active", "coming_soon"])
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  const enriched = await enrichStorefrontProducts(data ?? []);
  const bySlug = new Map(enriched.map((p) => [p.slug, p]));
  return slugs.map((slug) => bySlug.get(slug)).filter((p): p is StorefrontProduct => !!p);
}

export async function getStorefrontProductsByIds(ids: string[]): Promise<StorefrontProduct[]> {
  if (ids.length === 0) return [];

  const supabase = catalogClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", ids)
    .in("status", ["active", "coming_soon"])
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  const enriched = await enrichStorefrontProducts(data ?? []);
  const byId = new Map(enriched.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is StorefrontProduct => !!p);
}

/** Fixed-order catalog of the launch products — cross-request cached. */
export const listSevenStorefrontProducts = cache(async (): Promise<StorefrontProduct[]> => {
  return getCachedSevenProducts();
});

async function loadSevenStorefrontProducts(): Promise<StorefrontProduct[]> {
  const supabase = catalogClient();
  const slugs = [...LAUNCH_PRODUCT_SLUGS];

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "active")
    .is("deleted_at", null)
    .in("slug", slugs);

  if (error) throw new Error(error.message);

  const bySlug = new Map((data ?? []).map((row) => [row.slug, row]));
  const ordered = slugs.map((slug) => bySlug.get(slug)).filter((row): row is NonNullable<typeof row> => !!row);

  const enriched = await enrichStorefrontProducts(ordered);

  return enriched.map((product) => ({
    ...product,
    imageUrl: resolveSevenProductImage(product.slug, product.imageUrl),
  }));
}

const getCachedSevenProducts = unstable_cache(
  loadSevenStorefrontProducts,
  ["storefront-seven-products"],
  { revalidate: CATALOG_REVALIDATE_SEC, tags: ["catalog"] },
);

async function fetchPublishedFaqs(
  supabase: SupabaseClient<Database>,
): Promise<StorefrontFaq[]> {
  const client = supabase as unknown as SupabaseClient;
  const { data, error } = await client
    .from("faqs")
    .select("id,question,answer")
    .eq("is_published", true)
    .order("position", { ascending: true })
    .limit(12);

  if (error || !data) return [];

  return (data as { id: string; question: string; answer: string }[]).map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
  }));
}
