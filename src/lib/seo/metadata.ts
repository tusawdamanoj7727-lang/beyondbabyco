import type { Metadata } from "next";

import {
  BRAND_OG_HEIGHT,
  BRAND_OG_HOME,
  BRAND_OG_IMAGE,
  BRAND_OG_PRODUCTS,
  BRAND_OG_WIDTH,
} from "@/lib/brand/logo";
import { resolveCategoryOgPath, resolveOgImagePath, resolveProductOgPath } from "@/lib/brand/real-assets";
import { dynamicOgImageUrl } from "@/lib/seo/og-images";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TWITTER, absoluteUrl, getCanonicalSiteUrl } from "./site";

function metadataBase(): URL {
  return new URL(getCanonicalSiteUrl());
}

type PageMetaInput = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  keywords?: string[];
  /** Use /api/og with page title when no static image is provided. */
  dynamicOg?: boolean;
};

function resolveOgImage(input: PageMetaInput): { url: string; width: number; height: number } {
  if (input.image) {
    return {
      url: absoluteUrl(input.image),
      width: input.imageWidth ?? BRAND_OG_WIDTH,
      height: input.imageHeight ?? BRAND_OG_HEIGHT,
    };
  }

  if (input.dynamicOg) {
    return {
      url: dynamicOgImageUrl(input.title, input.description ?? SITE_DESCRIPTION),
      width: BRAND_OG_WIDTH,
      height: BRAND_OG_HEIGHT,
    };
  }

  return {
    url: absoluteUrl(BRAND_OG_IMAGE),
    width: BRAND_OG_WIDTH,
    height: BRAND_OG_HEIGHT,
  };
}

export function buildPageMetadata(input: PageMetaInput): Metadata {
  const pageTitle = input.title;
  const title = pageTitle.includes(SITE_NAME) ? pageTitle : `${pageTitle} — ${SITE_NAME}`;
  const description = input.description ?? SITE_DESCRIPTION;
  const canonicalPath = input.path ?? "/";
  const url = absoluteUrl(canonicalPath);
  const { url: image, width: imageWidth, height: imageHeight } = resolveOgImage(input);

  return {
    metadataBase: metadataBase(),
    title,
    description,
    ...(input.keywords?.length ? { keywords: input.keywords } : {}),
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
      images: [{ url: image, alt: pageTitle, width: imageWidth, height: imageHeight }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: SITE_TWITTER,
      creator: SITE_TWITTER,
      images: [image],
    },
  };
}

/** Homepage OG — brand hero card. */
export function buildHomepageMetadata(input: Omit<PageMetaInput, "image">): Metadata {
  const ogPath = resolveOgImagePath("home", BRAND_OG_HOME);
  return buildPageMetadata({ ...input, image: ogPath });
}

/** Product catalog OG */
export function buildProductsMetadata(input: Omit<PageMetaInput, "image">): Metadata {
  return buildPageMetadata({ ...input, image: BRAND_OG_PRODUCTS });
}

/** Product PDP OG — real product OG card, else product hero image, else default. */
export function buildProductMetadata(
  input: PageMetaInput & { productSlug: string },
): Metadata {
  const ogPath = input.image
    ? input.image
    : resolveProductOgPath(input.productSlug, BRAND_OG_PRODUCTS);
  const base = buildPageMetadata({
    title: input.title,
    description: input.description,
    path: input.path,
    noIndex: input.noIndex,
    keywords: input.keywords,
    image: ogPath,
    imageWidth: ogPath.includes("/real/og/") || ogPath.includes("/images/og/") ? BRAND_OG_WIDTH : input.imageWidth,
    imageHeight: ogPath.includes("/real/og/") || ogPath.includes("/images/og/") ? BRAND_OG_HEIGHT : input.imageHeight,
  });

  return {
    ...base,
    openGraph: {
      ...(typeof base.openGraph === "object" ? base.openGraph : {}),
      type: "product",
    } as Metadata["openGraph"],
  };
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
