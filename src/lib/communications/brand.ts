import { brandSupportEmail } from "@/lib/brand/contact";
import { BRAND_EMAIL_LOGO, BRAND_EMAIL_LOGO_HEIGHT, BRAND_EMAIL_LOGO_WIDTH } from "@/lib/brand/logo";
import { absoluteUrl } from "@/lib/seo/site";

/** Email-safe brand tokens (inline styles only — no CSS variables in email). */
export const EMAIL_BRAND = {
  colors: {
    green900: "#1d452d",
    green800: "#245738",
    green700: "#2d6b45",
    green100: "#e8f5ec",
    green50: "#f3fbf6",
    terra500: "#cd6a45",
    terra600: "#ad5639",
    cream50: "#fffdf8",
    cream100: "#fef9eb",
    white: "#ffffff",
    textPrimary: "#1d452d",
    textSecondary: "#2d6b45",
    textMuted: "#5a8a6a",
    border: "#d4e8da",
    darkBg: "#0f2818",
    darkCard: "#1a3324",
    darkText: "#f3fbf6",
    darkMuted: "#a8c9b4",
  },
  fonts: {
    heading: "'Montserrat', 'Helvetica Neue', Helvetica, sans-serif",
    body: "'Helvetica Neue', Helvetica, sans-serif",
  },
  logo: {
    url: absoluteUrl(BRAND_EMAIL_LOGO),
    alt: "BeyondBabyCo",
    width: BRAND_EMAIL_LOGO_WIDTH,
    height: BRAND_EMAIL_LOGO_HEIGHT,
  },
  contact: {
    email: brandSupportEmail(),
    phone: "",
    address: "Udaipur, Rajasthan, India",
    company: "Tusawda Global Private Limited",
    supportHours: "Monday–Saturday, 10 AM – 6 PM IST",
  },
  social: {
    instagram: "https://instagram.com/beyondbabyco",
  },
  legal: {
    privacyUrl: absoluteUrl("/privacy-policy"),
    termsUrl: absoluteUrl("/terms-of-service"),
    unsubscribeUrl: "{{unsubscribe_url}}",
  },
  trustBadges: [
    { label: "Dermatologically Tested", emoji: "🛡️" },
    { label: "Made in India", emoji: "🇮🇳" },
    { label: "Cruelty Free", emoji: "🐰" },
  ] as const,
} as const;
