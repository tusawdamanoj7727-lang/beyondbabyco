import type { ImageCategory } from "./types";

export type AiImagePresetId =
  | "hero_background"
  | "lifestyle"
  | "category_illustration"
  | "marketing_banner";

export interface AiImagePreset {
  id: AiImagePresetId;
  label: string;
  description: string;
  category: ImageCategory;
  prompt: string;
  filenamePrefix: string;
  width?: number;
  height?: number;
}

export const AI_IMAGE_PRESETS: AiImagePreset[] = [
  {
    id: "hero_background",
    label: "Hero background",
    description: "Soft cream and green hero banner for the storefront",
    category: "hero",
    filenamePrefix: "hero-banner",
    width: 1920,
    height: 1080,
    prompt:
      "Premium baby care brand hero background, soft cream and sage green gradient, gentle natural light, minimal abstract shapes, no text, no logos, editorial quality, 4k",
  },
  {
    id: "lifestyle",
    label: "Lifestyle photo",
    description: "Placeholder lifestyle scene for product pages",
    category: "lifestyle",
    filenamePrefix: "lifestyle",
    width: 1024,
    height: 1024,
    prompt:
      "Warm nursery lifestyle photography, soft morning light, neutral cream tones, baby care products on wooden shelf, cozy and premium, no text",
  },
  {
    id: "category_illustration",
    label: "Category illustration",
    description: "Friendly illustration for category tiles",
    category: "marketing",
    filenamePrefix: "category",
    width: 1024,
    height: 1024,
    prompt:
      "Friendly flat illustration for baby care category, soft pastel green and cream palette, simple shapes, mascot-free, no text, premium children's brand style",
  },
  {
    id: "marketing_banner",
    label: "Marketing banner",
    description: "Wide banner for campaigns and promos",
    category: "marketing",
    filenamePrefix: "banner",
    width: 1600,
    height: 900,
    prompt:
      "Premium baby care marketing banner background, research-backed skincare mood, soft gradients, botanical hints, no text, no watermark, commercial quality",
  },
];
