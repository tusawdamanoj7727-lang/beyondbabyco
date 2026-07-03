/**
 * Client-safe constants, types and pure helpers for the media library.
 * Kept separate from `media-library.ts` (which is `server-only`) so client
 * components can import them without pulling server code into the bundle.
 */

export const MEDIA_BUCKETS = [
  "products",
  "homepage",
  "mascots",
  "blog",
  "media",
  "documents",
] as const;
export type MediaBucket = (typeof MEDIA_BUCKETS)[number];

export const MEDIA_TYPES = ["image", "video", "pdf", "other"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const MEDIA_SORTS = ["newest", "oldest", "largest", "smallest", "name"] as const;
export type MediaSort = (typeof MEDIA_SORTS)[number];

export interface MediaListParams {
  search?: string;
  bucket?: MediaBucket | "all";
  folderId?: string;
  pathPrefix?: string;
  productId?: string;
  minWidth?: number;
  minSizeBytes?: number;
  maxSizeBytes?: number;
  type?: MediaType | "all";
  sort?: MediaSort;
  page?: number;
  perPage?: number;
}

export interface MediaItem {
  id: string;
  folderId: string | null;
  bucket: string;
  path: string;
  url: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  originalName: string | null;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  alt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaListResult {
  rows: MediaItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface MediaFolderItem {
  id: string;
  name: string;
  slug: string | null;
  bucket: string | null;
  pathPrefix: string;
  icon: string | null;
  isSystem: boolean;
  position: number;
}

export function mediaKind(mime: string | null): MediaType {
  if (!mime) return "other";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";
  return "other";
}
