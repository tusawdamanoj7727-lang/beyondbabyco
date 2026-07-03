"use server";

import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import type { AiAssetStatus, AiCompareDimension, AiGenerationMeta } from "./ai-asset-types";
import { getAiAsset, parseAssetId } from "./ai-asset-library";
import {
  GENERATED_DIR,
  pngPathForAsset,
  readReviewsFile,
  writeReviewsFile,
} from "./ai-asset-storage";
import { writeGeneratedDerivatives } from "./ai-asset-derivatives";

async function staffEmail() {
  const { user } = await requirePermission(PERMISSIONS.MEDIA_MANAGE);
  if (!user) throw new Error("Unauthorized");
  return user.email ?? user.id;
}

function touchReview(
  assetId: string,
  patch: { status?: AiAssetStatus; notes?: string; reviewedBy?: string; replacedBy?: string },
) {
  const file = readReviewsFile();
  const existing = file.reviews[assetId] ?? getAiAsset(assetId);
  if (!existing) throw new Error(`Asset not found: ${assetId}`);
  file.reviews[assetId] = {
    ...existing,
    ...patch,
    assetId,
    reviewedAt: new Date().toISOString(),
  };
  writeReviewsFile(file);
}

export async function approveAiAsset(assetId: string, notes?: string) {
  const email = await staffEmail();
  touchReview(assetId, { status: "approved", notes, reviewedBy: email });
  revalidatePath("/admin/ai-assets");
  revalidatePath("/");
  return { ok: true };
}

export async function rejectAiAsset(assetId: string, notes?: string) {
  const email = await staffEmail();
  touchReview(assetId, { status: "rejected", notes, reviewedBy: email });
  revalidatePath("/admin/ai-assets");
  return { ok: true };
}

export async function archiveAiAsset(assetId: string) {
  const email = await staffEmail();
  touchReview(assetId, { status: "archived", reviewedBy: email });
  revalidatePath("/admin/ai-assets");
  return { ok: true };
}

export async function bulkUpdateAiAssetStatus(assetIds: string[], status: AiAssetStatus) {
  await requirePermission(PERMISSIONS.MEDIA_MANAGE);
  const email = await staffEmail();
  const file = readReviewsFile();
  for (const assetId of assetIds) {
    const existing = file.reviews[assetId] ?? getAiAsset(assetId);
    if (!existing) continue;
    file.reviews[assetId] = {
      ...existing,
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: email,
    };
  }
  writeReviewsFile(file);
  revalidatePath("/admin/ai-assets");
  if (status === "approved") revalidatePath("/");
  return { ok: true, count: assetIds.length };
}

export async function assignApprovedAssetToSlot(assetId: string, slotKey: string) {
  const email = await staffEmail();
  const file = readReviewsFile();
  const review = file.reviews[assetId] ?? getAiAsset(assetId);
  if (!review) throw new Error("Asset not found");
  if (review.status !== "approved") throw new Error("Only approved assets can be assigned to live slots");

  file.reviews[assetId] = { ...review, status: "approved" };
  file.slotAssignments[slotKey] = {
    assetId,
    slotKey,
    confirmedAt: new Date().toISOString(),
    confirmedBy: email,
  };
  writeReviewsFile(file);
  revalidatePath("/admin/ai-assets");
  revalidatePath("/");
  return { ok: true, slotKey };
}

export async function bulkAssignApprovedAssets(assignments: { assetId: string; slotKey: string }[]) {
  for (const a of assignments) {
    await assignApprovedAssetToSlot(a.assetId, a.slotKey);
  }
  return { ok: true, count: assignments.length };
}

export async function replaceAiAsset(originalId: string, replacementId: string) {
  const email = await staffEmail();
  const file = readReviewsFile();
  const original = file.reviews[originalId] ?? getAiAsset(originalId);
  const replacement = file.reviews[replacementId] ?? getAiAsset(replacementId);
  if (!original || !replacement) throw new Error("Asset not found");
  if (replacement.status !== "approved") throw new Error("Replacement must be approved");

  file.reviews[originalId] = {
    ...original,
    status: "archived",
    replacedBy: replacementId,
    reviewedAt: new Date().toISOString(),
    reviewedBy: email,
  };

  for (const [slot, assignment] of Object.entries(file.slotAssignments)) {
    if (assignment.assetId === originalId) {
      file.slotAssignments[slot] = {
        ...assignment,
        assetId: replacementId,
        confirmedAt: new Date().toISOString(),
        confirmedBy: email,
      };
    }
  }

  writeReviewsFile(file);
  revalidatePath("/admin/ai-assets");
  revalidatePath("/");
  return { ok: true };
}

export async function uploadPackagingReference(productLine: string, formData: FormData) {
  await requirePermission(PERMISSIONS.MEDIA_MANAGE);
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Missing file");

  const destDir = join(GENERATED_DIR, "products", productLine);
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, "reference-packaging.png");
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(dest, buffer);

  const reviews = readReviewsFile();
  reviews.packagingReferences[productLine] = `/images/generated/products/${productLine}/reference-packaging.png`;
  writeReviewsFile(reviews);

  revalidatePath("/admin/ai-assets");
  return { ok: true, url: reviews.packagingReferences[productLine] };
}

export async function saveCroppedAsset(assetId: string, formData: FormData) {
  await requirePermission(PERMISSIONS.MEDIA_MANAGE);
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Missing cropped image");

  const { category, slug } = parseAssetId(assetId);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeGeneratedDerivatives(category, slug, buffer);

  revalidatePath("/admin/ai-assets");
  return { ok: true };
}

export async function deleteAiAsset(assetId: string) {
  await requirePermission(PERMISSIONS.MEDIA_MANAGE);
  const { category, slug } = parseAssetId(assetId);
  const base = join(GENERATED_DIR, category, slug);
  for (const ext of [".png", ".webp", ".avif", ".blur.txt"]) {
    const p = `${base}${ext}`;
    if (existsSync(p)) unlinkSync(p);
  }

  const file = readReviewsFile();
  delete file.reviews[assetId];
  for (const [slot, assignment] of Object.entries(file.slotAssignments)) {
    if (assignment.assetId === assetId) delete file.slotAssignments[slot];
  }
  writeReviewsFile(file);
  revalidatePath("/admin/ai-assets");
  return { ok: true };
}

export async function registerAiAssetGeneration(
  assetId: string,
  meta: {
    prompt?: string;
    negativePrompt?: string;
    generation?: AiGenerationMeta;
    score?: number;
    scene?: string;
  },
) {
  const file = readReviewsFile();
  const { category, slug } = parseAssetId(assetId);
  const existing = file.reviews[assetId];
  file.reviews[assetId] = {
    assetId,
    category,
    slug,
    status: existing?.status ?? "pending",
    score: meta.score ?? existing?.score ?? 0,
    scene: meta.scene ?? existing?.scene,
    prompt: meta.prompt ?? existing?.prompt,
    negativePrompt: meta.negativePrompt ?? existing?.negativePrompt,
    generation: meta.generation ?? existing?.generation,
    tags: existing?.tags ?? ["Generated", "Editorial"],
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    publicUrl: `/images/generated/${category}/${slug}.webp`,
    productLine: category === "products" ? slug.split("/")[0] : undefined,
  };
  writeReviewsFile(file);
}

export async function compareAiAssets(assetIdA: string, assetIdB: string, winnerId: string) {
  await requirePermission(PERMISSIONS.MEDIA_MANAGE);
  const a = getAiAsset(assetIdA);
  const b = getAiAsset(assetIdB);
  if (!a || !b) throw new Error("Assets not found");

  const dimensions: AiCompareDimension[] = [
    "lighting",
    "composition",
    "realism",
    "brandConsistency",
    "faceQuality",
    "packaging",
  ];

  const breakdown = dimensions.map((dim) => {
    const key = dim === "brandConsistency" ? "brandConsistency" : dim === "faceQuality" ? "faceQuality" : dim;
    const scoreA = (a.scoreBreakdown as Record<string, number> | undefined)?.[key] ?? 0;
    const scoreB = (b.scoreBreakdown as Record<string, number> | undefined)?.[key] ?? 0;
    return { dimension: dim, scoreA, scoreB, winner: scoreA >= scoreB ? assetIdA : assetIdB };
  });

  if (winnerId === assetIdA) await approveAiAsset(assetIdA, "Comparison winner");
  else if (winnerId === assetIdB) await approveAiAsset(assetIdB, "Comparison winner");

  return { ok: true, breakdown, winnerId };
}

export async function exportSelectedAiAssets(assetIds: string[]) {
  await requirePermission(PERMISSIONS.MEDIA_MANAGE);
  const items = assetIds
    .map((id) => getAiAsset(id))
    .filter(Boolean)
    .map((a) => ({
      assetId: a!.assetId,
      status: a!.status,
      score: a!.score,
      publicUrl: a!.publicUrl,
      prompt: a!.prompt,
    }));
  return { ok: true, items };
}

export async function getOriginalPngPath(assetId: string) {
  await requirePermission(PERMISSIONS.MEDIA_MANAGE);
  const { category, slug } = parseAssetId(assetId);
  const path = pngPathForAsset(category, slug);
  if (!existsSync(path)) throw new Error("Original PNG not found");
  return { ok: true, url: `/images/generated/${category}/${slug}.png` };
}
