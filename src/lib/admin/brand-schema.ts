import { z } from "zod";

import { CATALOG_FORM_STATUSES } from "./category-schema";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalText = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));

export const brandInputSchema = z.object({
  name: z.string().trim().min(1, "Brand name is required").max(160),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(160)
    .regex(slugRegex, "Use lowercase letters, numbers and hyphens"),
  website_url: optionalText,
  description: optionalText,
  country_of_origin: optionalText,

  // Media
  logo_url: optionalText,
  banner_url: optionalText,

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

export type BrandInput = z.infer<typeof brandInputSchema>;
