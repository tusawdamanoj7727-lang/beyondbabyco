#!/usr/bin/env node
/** Seed pending reviews from flux-scores + disk assets. */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { registerReviewEntry } from "./lib/review-registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const SCORES = join(__dirname, "data", "flux-scores.json");
const GEN = join(ROOT, "public/images/generated");

function walk(dir, base = "") {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith("_")) continue;
    const rel = base ? `${base}/${e.name}` : e.name;
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full, rel));
    else if (e.name.endsWith(".webp") && !/-(?:480|768|1024|1536)\.webp$/.test(e.name)) out.push(rel.replace(/\.webp$/, ""));
  }
  return out;
}

const scores = existsSync(SCORES) ? JSON.parse(readFileSync(SCORES, "utf8")) : { assets: {} };
let n = 0;
for (const id of walk(GEN)) {
  const entry = scores.assets?.[id];
  registerReviewEntry(id, {
    score: entry?.score ?? 0,
    scoreBreakdown: entry?.breakdown,
    hardRejectReasons: entry?.hardRejectReasons,
    scene: id.split("/").slice(-1)[0],
  });
  n++;
}
console.log(`Synced ${n} assets to review queue (status: pending until admin approves)`);
