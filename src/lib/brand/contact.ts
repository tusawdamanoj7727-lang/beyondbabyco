/** Public brand support email — override via env in production. */
const DEFAULT_BRAND_EMAIL = "info@beyondbabyco.com";

/** Digits only, with country code — e.g. 919876543210 */
const DEFAULT_WHATSAPP_NUMBER = "917296887936";

const DEFAULT_WHATSAPP_MESSAGE = "Hi! I have a question about BeyondBabyCo products 👶";

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

export function brandWhatsAppNumber(): string {
  return (
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    process.env.NEXT_PUBLIC_BRAND_PHONE?.trim()?.replace(/\D/g, "") ||
    DEFAULT_WHATSAPP_NUMBER
  ).replace(/\D/g, "");
}

export function brandWhatsAppMessage(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE?.trim() || DEFAULT_WHATSAPP_MESSAGE;
}

export function isWhatsAppConfigured(): boolean {
  const n = brandWhatsAppNumber();
  return n.length >= 10 && !/X/i.test(n);
}

export function brandWhatsAppDisplay(): string {
  const n = brandWhatsAppNumber();
  if (n.startsWith("91") && n.length === 12) {
    return `+91 ${n.slice(2, 7)} ${n.slice(7)}`;
  }
  if (n.length === 10) {
    return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
  }
  return `+${n}`;
}

export function brandWhatsAppUrl(message?: string): string {
  const text = encodeURIComponent(message ?? brandWhatsAppMessage());
  return `https://wa.me/${brandWhatsAppNumber()}?text=${text}`;
}

export function brandSupportPhoneDisplay(): string {
  return brandWhatsAppDisplay();
}

export function brandSupportPhoneTel(): string {
  const n = brandWhatsAppNumber();
  return n.startsWith("91") ? `+${n}` : `+91${n}`;
}
