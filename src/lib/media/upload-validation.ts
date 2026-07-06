/** Raster image MIME types allowed for user uploads (no SVG). */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const ALLOWED_IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

export function isAllowedImageType(mime: string): mime is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(mime);
}

export function validateImageUpload(file: Pick<File, "type">): string | null {
  if (!isAllowedImageType(file.type)) {
    return "Only JPG, PNG, WebP allowed";
  }
  return null;
}

export function assertAllowedImageUpload(file: Pick<File, "type">): void {
  const message = validateImageUpload(file);
  if (message) throw new Error(message);
}
