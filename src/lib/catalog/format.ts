import { resolveProductGstRate } from "@/lib/catalog/gst-rates";
import type { StorefrontProduct } from "./types";

export function effectivePrice(price: number, salePrice: number | null): number {
  if (salePrice != null && salePrice > 0 && salePrice < price) return salePrice;
  return price;
}

export function discountPercent(
  compareAt: number | null,
  price: number,
  salePrice: number | null,
): number | null {
  const mrp = compareAt && compareAt > 0 ? compareAt : price;
  const sell = effectivePrice(price, salePrice);
  if (mrp <= sell) return null;
  return Math.round(((mrp - sell) / mrp) * 100);
}

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function productBadge(row: {
  status: string;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured?: boolean;
}): string | null {
  if (row.status === "coming_soon") return "Coming Soon";
  if (row.isBestSeller) return "Best Seller";
  if (row.isNewArrival) return "New";
  return null;
}

/** Secondary trust badge shown on cards when applicable. */
export function productSecondaryBadge(row: { status: string }): string | null {
  if (row.status === "coming_soon") return "Research Complete";
  if (row.status === "active") return "Research Backed";
  return null;
}

export function toStorefrontPricing(row: {
  price: number;
  compare_at_price?: number | null;
  sale_price?: number | null;
}) {
  const price = row.price;
  const compareAtPrice = row.compare_at_price ?? null;
  const salePrice = row.sale_price ?? null;
  const effective = effectivePrice(price, salePrice);
  return {
    price,
    compareAtPrice,
    salePrice,
    effectivePrice: effective,
    discountPercent: discountPercent(compareAtPrice, price, salePrice),
  };
}

export function mapRowToStorefrontProduct(
  row: {
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
    is_trending?: boolean;
  },
  extras: {
    categoryName?: string | null;
    categorySlug?: string | null;
    ageGroupName?: string | null;
    ageGroupSlug?: string | null;
    subcategoryName?: string | null;
    brandName?: string | null;
    brandSlug?: string | null;
    imageUrl?: string | null;
    imageBlurDataUrl?: string | null;
  } = {},
): StorefrontProduct {
  const pricing = toStorefrontPricing(row);
  const isBestSeller = row.is_best_seller;
  const isNewArrival = row.is_new_arrival;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    ...pricing,
    status: row.status,
    stock: row.stock,
    inStock: row.status === "active" && row.stock > 0,
    ratingAvg: row.rating_avg ?? 0,
    ratingCount: row.rating_count ?? 0,
    categoryId: row.category_id,
    categoryName: extras.categoryName ?? null,
    categorySlug: extras.categorySlug ?? null,
    ageGroupName: extras.ageGroupName ?? null,
    ageGroupSlug: extras.ageGroupSlug ?? null,
    subcategoryId: row.subcategory_id,
    subcategoryName: extras.subcategoryName ?? null,
    brandId: row.brand_id,
    brandName: extras.brandName ?? null,
    brandSlug: extras.brandSlug ?? null,
    imageUrl: extras.imageUrl ?? null,
    imageBlurDataUrl: extras.imageBlurDataUrl ?? null,
    isFeatured: row.is_featured,
    isBestSeller,
    isNewArrival,
    isTrending: row.is_trending ?? false,
    badge: productBadge({
      status: row.status,
      isBestSeller,
      isNewArrival,
      isFeatured: row.is_featured,
    }),
    secondaryBadge: productSecondaryBadge({ status: row.status }),
    gstRate: resolveProductGstRate(row.gst_rate, extras.categorySlug, row.slug),
  };
}

export function formatProductPrice(product: Pick<StorefrontProduct, "status" | "effectivePrice">): string {
  if (product.status === "coming_soon") return "Coming Soon";
  return formatInr(product.effectivePrice);
}
