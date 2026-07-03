/** Public brand support email — override via env in production. */
const DEFAULT_BRAND_EMAIL = "care@beyondbabyco.com";

export function brandSupportEmail(): string {
  return (
    process.env.NEXT_PUBLIC_BRAND_SUPPORT_EMAIL?.trim() ||
    process.env.BRAND_SUPPORT_EMAIL?.trim() ||
    DEFAULT_BRAND_EMAIL
  );
}

export function brandSupportMailto(subject?: string): string {
  const email = brandSupportEmail();
  if (!subject) return `mailto:${email}`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
