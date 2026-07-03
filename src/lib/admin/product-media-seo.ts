import type { MediaSectionId } from "./product-media-sections";

export interface MediaSeoSuggestions {
  alt: string;
  filename: string;
  title: string;
  caption: string;
  keywords: string;
}

export function suggestProductMediaSeo(opts: {
  productName: string;
  sectionId: MediaSectionId;
  originalFilename: string;
}): MediaSeoSuggestions {
  const { productName, sectionId, originalFilename } = opts;
  const sectionLabel = sectionId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const stem = originalFilename.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const alt = `${productName} — ${sectionLabel} | BeyondBabyCo`;
  const filename = `${productName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${sectionId}-${stem}`.slice(0, 80);
  const title = `${productName} ${sectionLabel}`;
  const caption = `Premium ${sectionLabel.toLowerCase()} photography for ${productName}.`;
  const keywords = [productName, "BeyondBabyCo", sectionLabel, "baby care", "organic"].join(", ");

  return { alt, filename, title, caption, keywords };
}
