import Link from "next/link";

const TRUST_ITEMS = [
  { icon: "✓", text: "Dermatologically Tested", href: "/research" },
  { icon: "🇮🇳", text: "Made in India", href: "/about" },
  { icon: "🌿", text: "100% Natural Ingredients", href: "/research" },
  { icon: "🚚", text: "Free Shipping ₹999+", href: "/shipping-policy" },
  { icon: "🔬", text: "5 Years R&D", href: "/research" },
] as const;

export default function HeroTrustBar() {
  return (
    <div className="border-b border-gray-100 bg-white py-3">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {TRUST_ITEMS.map((item) => (
            <Link
              key={item.text}
              href={item.href}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 transition-colors hover:text-brand-forest md:text-sm"
            >
              <span>{item.icon}</span>
              {item.text}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
