/**
 * Phase 11.3 — Asset paths and studio helpers for Next.js (Phase 11.4 wiring).
 */

import { GENERATED_ROOT, type AssetCategory } from "./art-direction";
import type { AssetEntry } from "./asset-catalog";

export const PHASE = "phase-11-3";

export function assetPublicDir(category: AssetCategory): string {
  return `${GENERATED_ROOT}/${category}`;
}

export function assetBasePath(entry: AssetEntry): string {
  return `${assetPublicDir(entry.category)}/${entry.slug}`;
}

export function assetPaths(entry: AssetEntry) {
  const base = assetBasePath(entry);
  return {
    png: `${base}.png`,
    webp: `${base}.webp`,
    avif: `${base}.avif`,
    blur: `${base}.blur.txt`,
    responsive: (width: number) => `${base}-${width}.webp`,
  };
}

export function assetUrl(entry: AssetEntry, format: "webp" | "avif" | "png" = "webp"): string {
  const base = assetBasePath(entry);
  return `${base}.${format}`;
}
