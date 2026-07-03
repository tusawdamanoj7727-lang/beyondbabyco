/**
 * Browser-only helpers to extract image dimensions and a tiny blurred
 * placeholder (data URL) from a File before upload. Returns null for
 * non-image files or when the browser cannot decode the file.
 */

export interface ImageMeta {
  width: number;
  height: number;
  blur: string | null;
}

export async function readImageMeta(file: File): Promise<ImageMeta | null> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return null;

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const blur = makeBlur(img);
    return { width, height, blur };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function makeBlur(img: HTMLImageElement): string | null {
  try {
    const w = 16;
    const ratio = img.naturalHeight / img.naturalWidth || 1;
    const h = Math.max(1, Math.round(w * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/webp", 0.5);
  } catch {
    return null;
  }
}
