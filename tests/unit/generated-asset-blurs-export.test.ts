import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

function walkWebpBlurFiles(dir: string, base = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(dir)) return out;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(out, walkWebpBlurFiles(full, rel));
    } else if (entry.name.endsWith(".blur.txt")) {
      const key = rel.replace(/\.blur\.txt$/, "");
      out[key] = readFileSync(full, "utf8").trim();
    }
  }
  return out;
}

describe("generated asset blurs export", () => {
  it("writes src/lib/brand/generated-blurs.json from public blur files", () => {
    const root = join(process.cwd(), "public/images/generated");
    const blurs = walkWebpBlurFiles(root);
    const outPath = join(process.cwd(), "src/lib/brand/generated-blurs.json");
    mkdirSync(join(process.cwd(), "src/lib/brand"), { recursive: true });
    writeFileSync(outPath, JSON.stringify(blurs, null, 0), "utf8");
    expect(Object.keys(blurs).length).toBeGreaterThan(100);
  });
});
