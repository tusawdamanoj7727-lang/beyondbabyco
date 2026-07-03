/**
 * Phase 12.0 — Real brand asset resolver.
 * Prefers production photography in /images/real when present; falls back to generated editorial.
 */

import { STATIC_IMAGE_BLUR } from "@/lib/media/image-placeholder";

import manifestData from "./real-assets-manifest.json";

export const REAL_ASSETS_ROOT = "/images/real";

type RealAssetEntry = {
  path: string;
  format: "webp" | "png" | "jpg" | "jpeg";
  width?: number;
  height?: number;
};

type RealAssetsManifest = {
  version: string;
  updatedAt: string;
  assets: Record<string, RealAssetEntry>;
};

const MANIFEST = manifestData as RealAssetsManifest;

/** Canonical key: `{category}/{slug}` e.g. `products/baby-wipes/front` */
export function realAssetKey(category: string, slug: string): string {
  return `${category}/${slug}`;
}

export function hasRealAsset(category: string, slug: string): boolean {
  return Boolean(MANIFEST.assets[realAssetKey(category, slug)]);
}

export function resolveRealAssetUrl(category: string, slug: string): string | null {
  const entry = MANIFEST.assets[realAssetKey(category, slug)];
  return entry?.path ?? null;
}

export function resolveRealVisual(
  category: string,
  slug: string,
): { url: string; blur: string } | null {
  const url = resolveRealAssetUrl(category, slug);
  if (!url) return null;
  return { url, blur: STATIC_IMAGE_BLUR };
}

/** OG images under /images/real/og/ or /images/brand/social/ */
export function resolveOgImagePath(relativePath: string, fallback: string): string {
  const key = relativePath.replace(/^\//, "").replace(/\.(png|webp|jpg)$/i, "");
  const entry = MANIFEST.assets[`og/${key}`] ?? MANIFEST.assets[key];
  return entry?.path ?? fallback;
}

export function resolveProductOgPath(slug: string, fallback: string): string {
  return resolveOgImagePath(`products/${slug}`, fallback);
}

export function resolveCategoryOgPath(slug: string, fallback: string): string {
  return resolveOgImagePath(`categories/${slug}`, fallback);
}

export function listRealAssets(): string[] {
  return Object.keys(MANIFEST.assets);
}

export function realAssetStats() {
  const keys = listRealAssets();
  const editorial = keys.filter((k) => k.startsWith("editorial/")).length;
  const products = keys.filter((k) => k.startsWith("products/")).length;
  const categories = keys.filter((k) => k.startsWith("categories/")).length;
  const og = keys.filter((k) => k.startsWith("og/")).length;
  return { total: keys.length, editorial, products, categories, og };
}
