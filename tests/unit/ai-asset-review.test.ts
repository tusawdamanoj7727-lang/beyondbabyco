import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { resolveApprovedSlotAsset } from "@/lib/admin/ai-asset-library";
import { AI_ASSET_STATUSES } from "@/lib/admin/ai-asset-types";

describe("Phase 11.5 AI asset reviews", () => {
  it("asset-reviews.json schema is valid", () => {
    const path = join(process.cwd(), "src/lib/brand/asset-reviews.json");
    expect(existsSync(path)).toBe(true);
    const data = JSON.parse(readFileSync(path, "utf8"));
    expect(data.phase).toBe("11.5");
    expect(data).toHaveProperty("reviews");
    expect(data).toHaveProperty("slotAssignments");
    expect(Object.keys(data.slotAssignments).length).toBeGreaterThan(0);
  });

  it("status enum includes pending approved rejected archived", () => {
    expect(AI_ASSET_STATUSES).toEqual(["pending", "approved", "rejected", "archived"]);
  });

  it("resolveApprovedSlotAsset returns null for unassigned slots", () => {
    expect(resolveApprovedSlotAsset("EDITORIAL.unassigned-slot")).toBeNull();
  });

  it("resolveApprovedSlotAsset returns approved homepage hero assignment", () => {
    const hero = resolveApprovedSlotAsset("EDITORIAL.hero");
    expect(hero).not.toBeNull();
    expect(hero?.category).toBe("hero");
    expect(hero?.slug).toMatch(/phase-8-1\/(hero-background|mother-baby|hero-glass)/);
  });
});
