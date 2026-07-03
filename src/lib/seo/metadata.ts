import type { Metadata } from "next";

import {
  BRAND_OG_HEIGHT,
  BRAND_OG_HOME,
  BRAND_OG_IMAGE,
  BRAND_OG_WIDTH,
} from "@/lib/brand/logo";
import { resolveCategoryOgPath, resolveOgImagePath, resolveProductOgPath } from "@/lib/brand/real-assets";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TWITTER, SITE_URL, absoluteUrl } from "./site";

export const METADATA_BASE = new URL(SITE_URL);

type PageMetaInput = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
};

export function buildPageMetadata(input: PageMetaInput): Metadata {
  const title = input.title.includes(SITE_NAME) ? input.title : `${input.title} — ${SITE_NAME}`;
  const description = input.description ?? SITE_DESCRIPTION;
  const url = input.path ? absoluteUrl(input.path) : SITE_URL;
  const image = input.image ? absoluteUrl(input.image) : absoluteUrl(BRAND_OG_IMAGE);
  const imageWidth = input.imageWidth ?? BRAND_OG_WIDTH;
  const imageHeight = input.imageHeight ?? BRAND_OG_HEIGHT;

  return {
    title,
    description,
    alternates: input.path ? { canonical: url } : undefined,
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
      images: [{ url: image, alt: SITE_NAME, width: imageWidth, height: imageHeight }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: SITE_TWITTER,
      images: [image],
    },
  };
}

/** Homepage OG — prefers real og/home asset when uploaded. */
export function buildHomepageMetadata(input: Omit<PageMetaInput, "image">): Metadata {
  const ogPath = resolveOgImagePath("home", BRAND_OG_HOME);
  return buildPageMetadata({ ...input, image: ogPath });
}

/** Product PDP OG — real product OG card, else product hero image, else default. */
export function buildProductMetadata(
  input: PageMetaInput & { productSlug: string },
): Metadata {
  const ogPath = input.image
    ? input.image
    : resolveProductOgPath(input.productSlug, BRAND_OG_IMAGE);
  return buildPageMetadata({
    title: input.title,
    description: input.description,
    path: input.path,
    noIndex: input.noIndex,
    image: ogPath,
    imageWidth: ogPath.includes("/real/og/") || ogPath.includes("/brand/og-") ? BRAND_OG_WIDTH : input.imageWidth,
    imageHeight: ogPath.includes("/real/og/") || ogPath.includes("/brand/og-") ? BRAND_OG_HEIGHT : input.imageHeight,
  });
}

/** Category / catalog OG */
export function buildCategoryMetadata(
  input: PageMetaInput & { categorySlug: string },
): Metadata {
  const ogPath = resolveCategoryOgPath(input.categorySlug, BRAND_OG_IMAGE);
  return buildPageMetadata({
    ...input,
    image: ogPath,
    imageWidth: BRAND_OG_WIDTH,
    imageHeight: BRAND_OG_HEIGHT,
  });
}
