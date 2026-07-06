/** Product media section definitions — path-based organization (no schema changes). */

export type MediaSectionId =
  | "primary"
  | "gallery"
  | "packaging-front"
  | "packaging-back"
  | "packaging-side"
  | "packaging-top"
  | "packaging-open"
  | "lifestyle"
  | "marketing"
  | "ingredients"
  | "documents"
  | "videos"
  | "360";

export type MediaAccept = "image" | "video" | "document" | "any";

export interface ProductMediaSection {
  id: MediaSectionId;
  label: string;
  /** Storage path segment under `{productId}/` */
  path: string;
  accept: MediaAccept;
  /** Recommended min width for quality warnings */
  minWidth?: number;
  /** Require transparent background warning */
  requireTransparency?: boolean;
}

export const PRODUCT_MEDIA_SECTIONS: ProductMediaSection[] = [
  { id: "primary", label: "Primary Image", path: "primary", accept: "image", minWidth: 800 },
  { id: "gallery", label: "Gallery Images", path: "gallery", accept: "image", minWidth: 600 },
  { id: "packaging-front", label: "Front Packaging", path: "packaging/front", accept: "image", minWidth: 800 },
  { id: "packaging-back", label: "Back Packaging", path: "packaging/back", accept: "image", minWidth: 800 },
  { id: "packaging-side", label: "Side View", path: "packaging/side", accept: "image", minWidth: 600 },
  { id: "packaging-top", label: "Top View", path: "packaging/top", accept: "image", minWidth: 600 },
  { id: "packaging-open", label: "Open Package", path: "packaging/open", accept: "image", minWidth: 600 },
  { id: "lifestyle", label: "Lifestyle Images", path: "lifestyle", accept: "image", minWidth: 1024 },
  { id: "marketing", label: "Marketing Images", path: "marketing", accept: "image", minWidth: 1024 },
  { id: "ingredients", label: "Ingredient Images", path: "ingredients", accept: "image", minWidth: 600 },
  { id: "documents", label: "Documents", path: "documents", accept: "document" },
  { id: "videos", label: "Videos", path: "videos", accept: "video" },
  { id: "360", label: "360° Images", path: "360", accept: "image", minWidth: 1200 },
];

export const TRASH_PATH_SEGMENT = ".trash";

export function getSection(id: MediaSectionId): ProductMediaSection {
  return PRODUCT_MEDIA_SECTIONS.find((s) => s.id === id) ?? PRODUCT_MEDIA_SECTIONS[1];
}

export const ASPECT_PRESETS = [
  { id: "1:1", label: "1:1 Square", ratio: 1 },
  { id: "4:5", label: "4:5 Product card", ratio: 4 / 5 },
  { id: "16:9", label: "16:9 Hero", ratio: 16 / 9 },
  { id: "3:2", label: "3:2 Gallery", ratio: 3 / 2 },
  { id: "card", label: "Product card", ratio: 4 / 5 },
  { id: "gallery", label: "Gallery preset", ratio: 3 / 2 },
  { id: "hero", label: "Hero preset", ratio: 16 / 9 },
] as const;

export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/webm"];
export const SUPPORTED_DOC_TYPES = ["application/pdf"];
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
