import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const MIGRATION_DIR = join(process.cwd(), "supabase/database");

describe("migration audit", () => {
  it("migration files are sequentially numbered", () => {
    const files = readdirSync(MIGRATION_DIR)
      .filter((f) => /^\d{3}_.+\.sql$/.test(f))
      .sort();

    expect(files.length).toBeGreaterThan(0);

    const numbers = files.map((f) => parseInt(f.slice(0, 3), 10));
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i]).toBeGreaterThan(numbers[i - 1]);
    }
  });

  it("migrations use idempotent patterns", () => {
    const files = readdirSync(MIGRATION_DIR).filter((f) => f.endsWith(".sql") && /^\d{3}_/.test(f));
    for (const file of files.slice(-5)) {
      const content = readFileSync(join(MIGRATION_DIR, file), "utf-8");
      expect(content.toLowerCase()).toMatch(/if not exists|on conflict|do nothing/);
    }
  });
});
