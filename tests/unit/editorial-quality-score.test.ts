import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

import { scoreEditorialImage, QUALITY_THRESHOLD } from "../../scripts/assets/lib/quality-score.mjs";
import { FLUX_SCENES_11_4B, expandSceneSlots } from "../../scripts/assets/lib/flux-catalog-11-4b.mjs";
import { MASTER_PROMPT, NEGATIVE_PROMPT, buildHeroPrompt, buildProductPrompt } from "../../scripts/assets/lib/commercial-prompts.mjs";

describe("Phase 11.4B commercial prompts", () => {
  it("master prompt matches spec opening", () => {
    expect(MASTER_PROMPT.startsWith("Luxury commercial baby skincare campaign photograph for BeyondBabyCo")).toBe(true);
    expect(MASTER_PROMPT).toContain("Canon EOS R5");
    expect(MASTER_PROMPT).toContain("85mm RF lens");
  });

  it("negative prompt includes packaging and anatomy guards", () => {
    expect(NEGATIVE_PROMPT).toContain("plastic skin");
    expect(NEGATIVE_PROMPT).toContain("wrong packaging");
    expect(NEGATIVE_PROMPT).toContain("deformed hands");
  });

  it("hero prompt uses master style and emotion direction", () => {
    const prompt = buildHeroPrompt();
    expect(prompt.startsWith(MASTER_PROMPT)).toBe(true);
    expect(prompt.toLowerCase()).toContain("looking at baby");
  });

  it("product prompt references uploaded packaging", () => {
    const prompt = buildProductPrompt("baby-wipes", "front");
    expect(prompt).toContain("uploaded BeyondBabyCo Baby Wipes packaging");
    expect(prompt).toContain("Packaging exactly preserved");
  });

  it("11.4B catalog is leaner than 11.4A (curated scenes)", () => {
    expect(FLUX_SCENES_11_4B.length).toBeLessThan(100);
    expect(FLUX_SCENES_11_4B.length).toBeGreaterThan(40);
    expect(expandSceneSlots().length).toBe(FLUX_SCENES_11_4B.length * 2);
  });
});

describe("Phase 11.4B editorial quality score", () => {
  it("scores synthetic cream image below threshold with hard reject", async () => {
    const buffer = await sharp({
      create: { width: 1280, height: 960, channels: 3, background: { r: 250, g: 247, b: 242 } },
    })
      .png()
      .toBuffer();
    const score = await scoreEditorialImage(buffer, { width: 1280, height: 960, procedural: true });
    expect(score.total).toBeLessThan(QUALITY_THRESHOLD);
    expect(score.passed).toBe(false);
    expect(score.hardRejectReasons.length).toBeGreaterThan(0);
  });

  it("hard rejects dark images", async () => {
    const buffer = await sharp({
      create: { width: 1280, height: 960, channels: 3, background: { r: 30, g: 25, b: 20 } },
    })
      .png()
      .toBuffer();
    const score = await scoreEditorialImage(buffer, { width: 1280, height: 960 });
    expect(score.hardRejectReasons).toContain("dark lighting");
    expect(score.passed).toBe(false);
  });
});

describe("Phase 11.4B prompt config", () => {
  it("prompt-engineering-11-4b.json exists with generation limits", () => {
    const path = join(process.cwd(), "scripts/assets/data/prompt-engineering-11-4b.json");
    expect(existsSync(path)).toBe(true);
    const data = JSON.parse(readFileSync(path, "utf8"));
    expect(data.generation.candidatesDefault).toBe(6);
    expect(data.generation.keepTop).toBe(2);
  });
});
