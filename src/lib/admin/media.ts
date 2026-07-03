/**
 * Shared constants/types for catalog media assets.
 *
 * Kept separate from `media-actions.ts` because a "use server" module may
 * only export async functions.
 */

export const MEDIA_BUCKET = "media";

/** Allowed asset folders inside the media bucket. */
export type MediaFolder = "categories" | "brands";

export interface MediaUploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}
