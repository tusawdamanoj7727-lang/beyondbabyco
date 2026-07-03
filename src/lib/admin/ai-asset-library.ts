import "server-only";

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import type {
  AiAssetDashboard,
  AiAssetListItem,
  AiAssetReview,
  AiAssetStatus,
  AiAssetTag,
} from "./ai-asset-types";
import {
  GENERATED_DIR,
  assetIdFromParts,
  parseAssetId,
  publicUrlForAsset,
  readFluxScores,
  readReviewsFile,
} from "./ai-asset-storage";

const SLOT_TOTAL = 53;
const PRODUCT_SLOT_TOTAL = 110;

function inferTags(category: string, slug: string): AiAssetTag[] {
  const tags: AiAssetTag[] = ["Generated", "Editorial"];
  const s = `${category}/${slug}`.toLowerCase();
  if (s.includes("hero")) tags.push("Hero");
  if (category === "lifestyle" || category === "community") tags.push("Lifestyle");
  if (category === "products") tags.push("Product");
  if (category === "science" || category === "research") tags.push("Science");
  if (category === "ingredients") tags.push("Ingredient");
  if (category === "newsletter") tags.push("Newsletter");
  if (category === "trust") tags.push("Trust");
  return [...new Set(tags)];
}

function walkWebpAssets(dir: string, base = ""): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkWebpAssets(full, rel));
    else if (entry.name.endsWith(".webp") && !/-(?:480|768|1024|1536)\.webp$/.test(entry.name) && !entry.name.endsWith("-alt.webp")) {
      out.push(rel.replace(/\.webp$/, ""));
    }
  }
  return out;
}

function inferScene(assetId: string, slug: string) {
  if (slug.includes("scene-")) return slug.split("/").pop() ?? slug;
  if (slug.includes("-alt")) return slug.replace(/-alt$/, " (alt)");
  return slug.split("/").pop() ?? slug;
}

function buildReviewFromDisk(assetId: string, scoreEntry?: { score?: number; breakdown?: Record<string, number>; hardRejectReasons?: string[] }): AiAssetReview {
  const { category, slug } = parseAssetId(assetId);
  const productLine = category === "products" ? slug.split("/")[0] : undefined;
  return {
    assetId,
    category,
    slug,
    status: "pending",
    score: scoreEntry?.score ?? 0,
    scene: inferScene(assetId, slug),
    productLine,
    scoreBreakdown: scoreEntry?.breakdown,
    hardRejectReasons: scoreEntry?.hardRejectReasons,
    tags: inferTags(category, slug),
    createdAt: existsSync(join(GENERATED_DIR, category, `${slug}.webp`))
      ? statSync(join(GENERATED_DIR, category, `${slug}.webp`)).mtime.toISOString()
      : new Date().toISOString(),
    publicUrl: publicUrlForAsset(category, slug),
  };
}

export function listAllAiAssets(): AiAssetReview[] {
  const reviewsFile = readReviewsFile();
  const scores = readFluxScores();
  const diskIds = walkWebpAssets(GENERATED_DIR);
  const merged = new Map<string, AiAssetReview>();

  for (const rel of diskIds) {
    const assetId = rel;
    const scoreEntry = scores.assets?.[assetId];
    const existing = reviewsFile.reviews[assetId];
    if (existing) {
      merged.set(assetId, {
        ...existing,
        score: existing.score || scoreEntry?.score || 0,
        scoreBreakdown: existing.scoreBreakdown ?? scoreEntry?.breakdown,
        publicUrl: publicUrlForAsset(existing.category, existing.slug),
      });
    } else {
      merged.set(assetId, buildReviewFromDisk(assetId, scoreEntry));
    }
  }

  for (const [id, review] of Object.entries(reviewsFile.reviews)) {
    if (!merged.has(id)) merged.set(id, review);
  }

  return [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAiAssetDashboard(): AiAssetDashboard {
  const assets = listAllAiAssets();
  const reviewsFile = readReviewsFile();
  const total = assets.length;
  const pending = assets.filter((a) => a.status === "pending").length;
  const approved = assets.filter((a) => a.status === "approved").length;
  const rejected = assets.filter((a) => a.status === "rejected").length;
  const archived = assets.filter((a) => a.status === "archived").length;
  const scored = assets.filter((a) => a.score > 0);
  const averageScore = scored.length ? scored.reduce((s, a) => s + a.score, 0) / scored.length : 0;

  const reasonCounts = new Map<string, number>();
  for (const a of assets) {
    for (const r of a.hardRejectReasons ?? []) {
      reasonCounts.set(r, (reasonCounts.get(r) ?? 0) + 1);
    }
    if (a.status === "rejected" && !a.hardRejectReasons?.length) {
      reasonCounts.set("manual rejection", (reasonCounts.get("manual rejection") ?? 0) + 1);
    }
  }

  const promptGroups = new Map<string, { total: number; sum: number }>();
  for (const a of assets) {
    if (!a.prompt) continue;
    const key = a.prompt.slice(0, 120);
    const g = promptGroups.get(key) ?? { total: 0, sum: 0 };
    g.total++;
    g.sum += a.score;
    promptGroups.set(key, g);
  }
  const promptStats = [...promptGroups.entries()].map(([prompt, g]) => ({
    prompt,
    avgScore: Math.round((g.sum / g.total) * 10) / 10,
    count: g.total,
  }));

  const slotsAssigned = Object.keys(reviewsFile.slotAssignments).length;
  const productsAssigned = Object.values(reviewsFile.slotAssignments).filter((s) => s.slotKey.includes("products")).length;

  const coveredScenes = new Set(assets.filter((a) => a.status === "approved").map((a) => a.scene ?? a.slug));
  const missingScenes = ["hero", "lifestyle/mother-baby", "science/dermatologist", "products/baby-wipes/front"].filter(
    (s) => ![...coveredScenes].some((c) => c.includes(s.replace("/", "-")) || c.includes(s)),
  );

  return {
    total,
    pending,
    approved,
    rejected,
    archived,
    acceptanceRate: total ? Math.round((approved / total) * 1000) / 10 : 0,
    averageScore: Math.round(averageScore * 10) / 10,
    rejectionReasons: [...reasonCounts.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    topPrompts: [...promptStats].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5),
    weakPrompts: [...promptStats].sort((a, b) => a.avgScore - b.avgScore).slice(0, 5),
    coverage: {
      slotsAssigned,
      slotsTotal: SLOT_TOTAL,
      productsAssigned,
      productsTotal: PRODUCT_SLOT_TOTAL,
    },
    missingScenes,
  };
}

export function listAiAssets(filters: {
  search?: string;
  status?: AiAssetStatus | "all";
  category?: string;
  page?: number;
  perPage?: number;
}): { rows: AiAssetListItem[]; total: number; page: number; perPage: number; pageCount: number } {
  let rows = listAllAiAssets();
  const search = filters.search?.trim().toLowerCase();
  if (search) {
    rows = rows.filter(
      (r) =>
        r.assetId.toLowerCase().includes(search) ||
        r.prompt?.toLowerCase().includes(search) ||
        r.scene?.toLowerCase().includes(search) ||
        r.productLine?.toLowerCase().includes(search),
    );
  }
  if (filters.status && filters.status !== "all") rows = rows.filter((r) => r.status === filters.status);
  if (filters.category && filters.category !== "all") rows = rows.filter((r) => r.category === filters.category);

  const perPage = filters.perPage ?? 24;
  const page = Math.max(1, filters.page ?? 1);
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const slice = rows.slice((page - 1) * perPage, page * perPage);

  return {
    rows: slice.map((r) => ({
      ...r,
      previewUrl: r.publicUrl,
      hasPrompt: Boolean(r.prompt),
    })),
    total,
    page,
    perPage,
    pageCount,
  };
}

export function getAiAsset(assetId: string): AiAssetReview | null {
  return listAllAiAssets().find((a) => a.assetId === assetId) ?? null;
}

export function getApprovedMediaLibraryItems(): AiAssetListItem[] {
  return listAllAiAssets()
    .filter((a) => a.status === "approved")
    .map((a) => ({ ...a, previewUrl: a.publicUrl, hasPrompt: Boolean(a.prompt) }));
}

export function resolveApprovedSlotAsset(slotKey: string): { category: string; slug: string } | null {
  const file = readReviewsFile();
  const assignment = file.slotAssignments[slotKey];
  if (!assignment) return null;
  const review = file.reviews[assignment.assetId];
  if (!review || review.status !== "approved") return null;
  return { category: review.category, slug: review.slug };
}

export { assetIdFromParts, parseAssetId, publicUrlForAsset };
