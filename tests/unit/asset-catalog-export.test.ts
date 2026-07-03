import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";

import { ASSET_CATALOG, NPM_CATEGORY_MAP } from "@/lib/brand/asset-catalog";
import { ASSET_CATEGORIES } from "@/lib/brand/art-direction";

describe("asset catalog export", () => {
  it("writes scripts/assets/data/catalog.json for Node asset scripts", () => {
    const outDir = join(process.cwd(), "scripts/assets/data");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      join(outDir, "catalog.json"),
      JSON.stringify({ categories: ASSET_CATEGORIES, npmCategoryMap: NPM_CATEGORY_MAP, assets: ASSET_CATALOG }, null, 2),
    );
  });
});
