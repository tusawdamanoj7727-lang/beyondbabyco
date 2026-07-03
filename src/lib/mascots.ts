import type { MascotPose, MascotType } from "../components/mascots";

/** Maps legacy CMS mascot ids to on-disk asset folders. */
export function resolveMascotAssetId(mascot: MascotType): string {
  if (mascot === "freddy-ferret") return "benny-bear";
  return mascot;
}

/** Legacy filename typos on disk — normalized before lookup. */
export const MASCOT_POSE_ALIASES: Record<string, MascotPose> = {
  studiyng: "studying",
};

const DEFAULT_POSE_CHAIN: MascotPose[] = ["default", "default-standing"];

export const MASCOT_ASSET_EXTENSIONS = ["webp", "png", "svg"] as const;
export type MascotAssetExtension = (typeof MASCOT_ASSET_EXTENSIONS)[number];

export function buildMascotAssetPath(
  assetId: string,
  pose: string,
  ext: MascotAssetExtension,
): string {
  return `/icons/${assetId}/${pose}.${ext}`;
}

/**
 * Ordered URL candidates for a mascot pose.
 * requested pose → default.webp → default.png → default.svg → null (hide)
 */
export function resolveMascotAssetCandidates(
  mascot: MascotType,
  pose: MascotPose,
): string[] {
  const assetId = resolveMascotAssetId(mascot);
  const normalizedPose = MASCOT_POSE_ALIASES[pose] ?? pose;
  const poseChain = [
    normalizedPose,
    ...DEFAULT_POSE_CHAIN.filter((p) => p !== normalizedPose),
  ];

  const candidates: string[] = [];
  for (const p of poseChain) {
    for (const ext of MASCOT_ASSET_EXTENSIONS) {
      candidates.push(buildMascotAssetPath(assetId, p, ext));
    }
  }

  return [...new Set(candidates)];
}

/** Primary asset URL (first candidate — used for preload hints). */
export function resolveMascotAssetSrc(mascot: MascotType, pose: MascotPose): string {
  return resolveMascotAssetCandidates(mascot, pose)[0] ?? "";
}

/** Unique floating durations — never synchronized. */
export const MASCOT_FLOAT_DURATIONS: Record<MascotType, number> = {
  "bella-bunny": 4.8,
  "gigi-giraffe": 5.4,
  "poppy-panda": 6.1,
  "eli-elephant": 5.6,
  "penny-penguin": 4.7,
  "benny-bear": 6.4,
  "freddy-ferret": 6.4,
};

export const ALL_MASCOTS: MascotType[] = [
  "bella-bunny",
  "gigi-giraffe",
  "poppy-panda",
  "eli-elephant",
  "penny-penguin",
  "benny-bear",
];

export const MASCOT_LABELS: Record<MascotType, string> = {
  "bella-bunny": "Bella Bunny",
  "gigi-giraffe": "Gigi Giraffe",
  "poppy-panda": "Poppy Panda",
  "eli-elephant": "Eli Elephant",
  "penny-penguin": "Penny Penguin",
  "benny-bear": "Benny Bear",
  "freddy-ferret": "Benny Bear",
};

export function mascotLabel(mascot: MascotType): string {
  return MASCOT_LABELS[mascot] ?? mascot;
}

export function mascotFloatDuration(mascot: MascotType): number {
  return MASCOT_FLOAT_DURATIONS[mascot] ?? 5.5;
}
