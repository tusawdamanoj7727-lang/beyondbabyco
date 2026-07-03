/** Phase 11.4C — AI asset review & curation types (JSON-backed, no DB schema). */

export const AI_ASSET_STATUSES = ["pending", "approved", "rejected", "archived"] as const;
export type AiAssetStatus = (typeof AI_ASSET_STATUSES)[number];

export const AI_ASSET_STATUS_LABELS: Record<AiAssetStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

export const AI_ASSET_TAGS = [
  "Generated",
  "Editorial",
  "Hero",
  "Lifestyle",
  "Product",
  "Science",
  "Ingredient",
  "Newsletter",
  "Trust",
  "Community",
  "Research",
] as const;

export type AiAssetTag = (typeof AI_ASSET_TAGS)[number];

export type AiGenerationMeta = {
  masterPrompt?: string;
  negativePrompt?: string;
  seed?: number;
  sampler?: string;
  cfg?: number;
  steps?: number;
  width?: number;
  height?: number;
  fluxVersion?: string;
  durationMs?: number;
  candidateIndex?: number;
  sceneId?: string;
};

export type AiScoreBreakdown = {
  lighting?: number;
  brandConsistency?: number;
  depth?: number;
  composition?: number;
  sharpness?: number;
  faceQuality?: number;
  realism?: number;
};

export type AiAssetReview = {
  assetId: string;
  category: string;
  slug: string;
  status: AiAssetStatus;
  score: number;
  scene?: string;
  productLine?: string;
  prompt?: string;
  negativePrompt?: string;
  generation?: AiGenerationMeta;
  scoreBreakdown?: AiScoreBreakdown;
  hardRejectReasons?: string[];
  tags: string[];
  notes?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  replacedBy?: string;
  publicUrl: string;
};

export type AiSlotAssignment = {
  assetId: string;
  slotKey: string;
  confirmedAt: string;
  confirmedBy: string;
};

export type AiAssetReviewsFile = {
  phase: string;
  updatedAt: string | null;
  reviews: Record<string, AiAssetReview>;
  slotAssignments: Record<string, AiSlotAssignment>;
  packagingReferences: Record<string, string>;
};

export type AiAssetListItem = AiAssetReview & {
  previewUrl: string;
  hasPrompt: boolean;
};

export type AiAssetDashboard = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  archived: number;
  acceptanceRate: number;
  averageScore: number;
  rejectionReasons: { reason: string; count: number }[];
  topPrompts: { prompt: string; avgScore: number; count: number }[];
  weakPrompts: { prompt: string; avgScore: number; count: number }[];
  coverage: { slotsAssigned: number; slotsTotal: number; productsAssigned: number; productsTotal: number };
  missingScenes: string[];
};

/** Site slots available for manual assignment after approval. */
export const AI_ASSIGNABLE_SLOTS = [
  "EDITORIAL.hero",
  "EDITORIAL.heroAlt",
  "EDITORIAL.science",
  "EDITORIAL.lifestyleHero",
  "EDITORIAL.lifestyleCards.0",
  "EDITORIAL.lifestyleCards.1",
  "EDITORIAL.lifestyleCards.2",
  "EDITORIAL.newsletter",
  "CONTENT_EDITORIAL.research",
  "CONTENT_EDITORIAL.scienceLab",
  "CONTENT_EDITORIAL.ingredients",
  "TRUST_EDITORIAL.trustHero",
  "TRUST_EDITORIAL.dermatology",
] as const;

export type AiAssignableSlot = (typeof AI_ASSIGNABLE_SLOTS)[number];

export const AI_COMPARE_DIMENSIONS = [
  "lighting",
  "composition",
  "realism",
  "brandConsistency",
  "faceQuality",
  "packaging",
] as const;

export type AiCompareDimension = (typeof AI_COMPARE_DIMENSIONS)[number];

export const AI_COMPARE_LABELS: Record<AiCompareDimension, string> = {
  lighting: "Lighting",
  composition: "Composition",
  realism: "Realism",
  brandConsistency: "Brand consistency",
  faceQuality: "Face quality",
  packaging: "Packaging",
};
