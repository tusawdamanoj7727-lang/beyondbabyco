import {
  MAX_UPLOAD_BYTES,
  SUPPORTED_DOC_TYPES,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_VIDEO_TYPES,
  type MediaAccept,
  type MediaSectionId,
  getSection,
} from "./product-media-sections";

export type ValidationSeverity = "error" | "warning";

export interface MediaValidationIssue {
  code: string;
  message: string;
  severity: ValidationSeverity;
}

export interface MediaValidationInput {
  file: { name: string; type: string; size: number };
  width?: number;
  height?: number;
  sectionId: MediaSectionId;
  existingUrls?: string[];
  hasAlpha?: boolean;
}

function acceptsType(accept: MediaAccept, mime: string): boolean {
  if (accept === "any") return true;
  if (accept === "image") return SUPPORTED_IMAGE_TYPES.includes(mime);
  if (accept === "video") return SUPPORTED_VIDEO_TYPES.includes(mime);
  if (accept === "document") return SUPPORTED_DOC_TYPES.includes(mime);
  return false;
}

export function validateProductMedia(input: MediaValidationInput): MediaValidationIssue[] {
  const issues: MediaValidationIssue[] = [];
  const section = getSection(input.sectionId);
  const { file, width, height } = input;

  if (file.size > MAX_UPLOAD_BYTES) {
    issues.push({
      code: "file_too_large",
      message: `File exceeds ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB limit.`,
      severity: "error",
    });
  }

  if (!acceptsType(section.accept, file.type)) {
    issues.push({
      code: "unsupported_format",
      message: `${file.type || "Unknown type"} is not supported in ${section.label}.`,
      severity: "error",
    });
  }

  if (width && height) {
    if (section.minWidth && width < section.minWidth) {
      issues.push({
        code: "too_small",
        message: `Image is ${width}px wide; ${section.label} recommends at least ${section.minWidth}px.`,
        severity: "warning",
      });
    }
    if (width < 400 || height < 400) {
      issues.push({
        code: "low_resolution",
        message: "Image may appear blurry on retina displays.",
        severity: "warning",
      });
    }
    const ratio = width / height;
    if (section.id === "primary" && (ratio < 0.7 || ratio > 1.4)) {
      issues.push({
        code: "aspect_ratio",
        message: "Primary image works best near square (1:1) or product card (4:5).",
        severity: "warning",
      });
    }
  }

  if (section.requireTransparency && input.hasAlpha === false) {
    issues.push({
      code: "no_transparency",
      message: "This section expects a transparent background (PNG/WebP with alpha).",
      severity: "warning",
    });
  }

  if (input.existingUrls?.some((u) => u.includes(safeName(file.name)))) {
    issues.push({
      code: "duplicate",
      message: "A file with a similar name may already exist in this product gallery.",
      severity: "warning",
    });
  }

  return issues;
}

function safeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** Client-side alpha detection via canvas sample. */
export async function detectImageAlpha(file: File): Promise<boolean | undefined> {
  if (!file.type.startsWith("image/") || file.type === "image/jpeg") return false;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(32, img.naturalWidth);
    canvas.height = Math.min(32, img.naturalHeight);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) return true;
    }
    return false;
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}
