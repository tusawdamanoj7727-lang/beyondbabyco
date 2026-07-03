import { z } from "zod";

import type { ProductStatus } from "@/lib/supabase/database.types";

export const PRODUCT_FORM_STATUSES = ["draft", "active", "archived"] as const;
export type ProductFormStatus = (typeof PRODUCT_FORM_STATUSES)[number];

export const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Draft",
  active: "Published",
  archived: "Archived",
  coming_soon: "Coming soon",
};

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalText = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));

const uuidOrNull = z
  .string()
  .uuid()
  .nullable()
  .optional()
  .transform((v) => v ?? null);

const nonNegNumberOrNull = z
  .number()
  .nonnegative()
  .nullable()
  .optional()
  .transform((v) => (v === undefined ? null : v));

export const productInputSchema = z
  .object({
    name: z.string().trim().min(1, "Product name is required").max(200),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .max(200)
      .regex(slugRegex, "Use lowercase letters, numbers and hyphens"),
    brand_id: uuidOrNull,
    category_id: uuidOrNull,
    subcategory_id: uuidOrNull,
    short_description: optionalText,
    description: optionalText,

    // Pricing — MRP maps to compare_at_price, Selling Price to price.
    compare_at_price: nonNegNumberOrNull,
    price: z.number({ message: "Selling price is required" }).nonnegative("Price must be ≥ 0"),
    sale_price: nonNegNumberOrNull,
    gst_rate: z.number().nonnegative().max(100).default(0),
    tax_class: optionalText,

    // Inventory
    sku: optionalText,
    barcode: optionalText,
    stock: z.number().int().nonnegative().default(0),
    low_stock_threshold: z.number().int().nonnegative().default(0),
    weight_grams: z.number().int().nonnegative().nullable().optional().transform((v) => v ?? null),
    length_cm: nonNegNumberOrNull,
    width_cm: nonNegNumberOrNull,
    height_cm: nonNegNumberOrNull,

    // Taxonomy
    ingredient_ids: z.array(z.string().uuid()).default([]),
    benefit_ids: z.array(z.string().uuid()).default([]),

    // SEO
    seo_title: optionalText,
    seo_description: optionalText,
    meta_keywords: optionalText,
    canonical_url: optionalText,

    // Publishing
    status: z.enum(PRODUCT_FORM_STATUSES).default("draft"),
    is_featured: z.boolean().default(false),
    is_best_seller: z.boolean().default(false),
    is_new_arrival: z.boolean().default(false),
    is_trending: z.boolean().default(false),
    launch_date: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v && v.length > 0 ? v : null)),
  })
  .refine(
    (v) => v.sale_price == null || v.compare_at_price == null || v.sale_price <= v.compare_at_price,
    { path: ["sale_price"], message: "Sale price cannot exceed MRP" },
  );

export type ProductInput = z.infer<typeof productInputSchema>;

/** Convert a product name into a URL-friendly slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
