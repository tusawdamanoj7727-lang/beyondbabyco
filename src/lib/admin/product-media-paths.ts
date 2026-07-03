import { PRODUCT_MEDIA_SECTIONS, TRASH_PATH_SEGMENT, type MediaSectionId } from "./product-media-sections";

const PRODUCTS_BUCKET = "products";

export function storagePathFromUrl(url: string): string | null {
  const marker = `/${PRODUCTS_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : decodeURIComponent(url.slice(idx + marker.length).split("?")[0] ?? "");
}

export function isTrashPath(path: string): boolean {
  return path.includes(`/${TRASH_PATH_SEGMENT}/`);
}

/** Infer section from storage path `{productId}/{section...}/file`. */
export function sectionFromStoragePath(path: string, productId: string): MediaSectionId {
  if (isTrashPath(path)) return "gallery";
  const prefix = `${productId}/`;
  if (!path.startsWith(prefix)) return "gallery";
  const rest = path.slice(prefix.length);

  for (const section of PRODUCT_MEDIA_SECTIONS) {
    if (rest === section.path || rest.startsWith(`${section.path}/`)) {
      return section.id;
    }
  }
  return "gallery";
}

export function sectionFromUrl(url: string, productId: string): MediaSectionId {
  const path = storagePathFromUrl(url);
  if (!path) return "gallery";
  return sectionFromStoragePath(path, productId);
}

export function buildStoragePaths(productId: string, sectionPath: string, baseName: string) {
  const root = `${productId}/${sectionPath}`;
  return {
    original: `${root}/originals/${baseName}`,
    main: `${root}/${baseName}.webp`,
    avif: `${root}/optimized/${baseName}.avif`,
    thumb: `${root}/thumbs/${baseName}-480.webp`,
    retina: `${root}/optimized/${baseName}@2x.webp`,
    responsive: (w: number) => `${root}/optimized/${baseName}-${w}.webp`,
  };
}

export function safeBaseName(originalName: string): string {
  const stem = originalName.replace(/\.[^.]+$/, "").toLowerCase();
  return stem.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "asset";
}
