export type StorefrontSort =
  | "featured"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "best_selling"
  | "rating";

export interface CatalogSearchParams {
  q?: string;
  category?: string;
  brand?: string;
  age?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  sort?: StorefrontSort;
  page?: number;
}

export interface StorefrontProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  salePrice: number | null;
  effectivePrice: number;
  discountPercent: number | null;
  status: string;
  stock: number;
  inStock: boolean;
  ratingAvg: number;
  ratingCount: number;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  ageGroupName: string | null;
  ageGroupSlug: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  brandSlug: string | null;
  imageUrl: string | null;
  imageBlurDataUrl?: string | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isTrending: boolean;
  badge: string | null;
  secondaryBadge?: string | null;
  /** GST % — 12 baby care, 18 cosmetics (from product.gst_rate). */
  gstRate: number;
  /** First active variant — used when adding from list/bundle (not PDP). */
  defaultVariantId?: string | null;
  defaultVariantName?: string | null;
}

export interface StorefrontProductImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  blurDataUrl?: string | null;
}

export interface StorefrontIngredient {
  id: string;
  name: string;
  inciName: string | null;
  description: string | null;
  notes: string | null;
}

export interface StorefrontBenefit {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
}

export interface StorefrontVariant {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  isActive: boolean;
  /** Sellable units at default warehouse (quantity − reserved). */
  stockQuantity: number;
}

export interface StorefrontFaq {
  id: string;
  question: string;
  answer: string;
}

export interface StorefrontProductDetail extends StorefrontProduct {
  description: string | null;
  sku: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: StorefrontProductImage[];
  ingredients: StorefrontIngredient[];
  benefits: StorefrontBenefit[];
  variants: StorefrontVariant[];
  faqs: StorefrontFaq[];
}

export interface CatalogListResult {
  products: StorefrontProduct[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface CatalogFilterOptions {
  categories: { id: string; name: string; slug: string }[];
  ageGroups: { id: string; name: string; slug: string }[];
  productTypes: { id: string; name: string; slug: string; categoryId: string }[];
  brands: { id: string; name: string; slug: string }[];
  priceRange: { min: number; max: number };
}

export interface CatalogBanner {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string | null;
}
