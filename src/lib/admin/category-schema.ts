import { z } from "zod";

import type { CatalogStatus } from "@/lib/supabase/database.types";

export const CATALOG_FORM_STATUSES = ["draft", "active", "archived"] as const;
export type CatalogFormStatus = (typeof CATALOG_FORM_STATUSES)[number];

export const CATALOG_STATUS_LABELS: Record<CatalogStatus, string> = {
  draft: "Draft",
  active: "Published",
  archived: "Archived",
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

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(160),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(160)
    .regex(slugRegex, "Use lowercase letters, numbers and hyphens"),
  parent_id: uuidOrNull,
  description: optionalText,

  // Media
  image_url: optionalText,
  banner_url: optionalText,
  icon_url: optionalText,

  // SEO
  seo_title: optionalText,
  seo_description: optionalText,
  meta_keywords: optionalText,
  canonical_url: optionalText,

  // Publishing
  status: z.enum(CATALOG_FORM_STATUSES).default("draft"),
  is_featured: z.boolean().default(false),
  position: z.number().int().nonnegative().default(0),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

/** Convert a name into a URL-friendly slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
