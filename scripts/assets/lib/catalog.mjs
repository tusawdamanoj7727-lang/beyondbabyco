/** Load asset catalog JSON (synced from src/lib/brand/asset-catalog.ts). */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = JSON.parse(readFileSync(join(__dirname, "..", "data", "catalog.json"), "utf8"));

export const ASSET_CATEGORIES = DATA.categories;
export const NPM_CATEGORY_MAP = DATA.npmCategoryMap;
export const ASSET_CATALOG = DATA.assets;

export function getAssetCounts() {
  const counts = {};
  for (const asset of ASSET_CATALOG) {
    counts[asset.category] = (counts[asset.category] ?? 0) + 1;
  }
  return counts;
}
