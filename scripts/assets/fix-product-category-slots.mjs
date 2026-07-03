#!/usr/bin/env node
/**
 * Remove Phase 11.5 slot assignments that incorrectly mapped product/category
 * slots to hero/phase-8-1 editorial assets. Resolver fallbacks use product renders.
 */

import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REVIEWS_PATH = join(__dirname, "..", "..", "src/lib/brand/asset-reviews.json");

function main() {
  const data = JSON.parse(readFileSync(REVIEWS_PATH, "utf8"));
  const assignments = data.slotAssignments ?? {};
  let removed = 0;

  for (const key of Object.keys(assignments)) {
    if (!key.startsWith("PRODUCT.") && !key.startsWith("CATEGORY.")) continue;
    const assetId = assignments[key]?.assetId ?? "";
    const review = data.reviews[assetId];
    if (review?.category === "hero" && review.slug?.startsWith("phase-8-1/")) {
      delete assignments[key];
      removed++;
    }
  }

  data.slotAssignments = assignments;
  data.updatedAt = new Date().toISOString();
  data.phase115SlotFix = {
    at: new Date().toISOString(),
    removedProductCategoryHeroAssignments: removed,
  };

  const json = JSON.stringify(data, null, 2);
  const tmp = `${REVIEWS_PATH}.tmp`;
  writeFileSync(tmp, json);
  renameSync(tmp, REVIEWS_PATH);

  console.log(`Removed ${removed} incorrect PRODUCT/CATEGORY hero slot assignment(s).`);
}

main();
