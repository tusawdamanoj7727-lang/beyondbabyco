import Link from "next/link";

import { TrustIcon } from "@/components/trust/TrustIcons";
import { focusRing, trustIconSize } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const TRUST_ITEMS = [
  { icon: "shield-check", text: "Dermatologically Tested", href: "/research" },
  { icon: "factory", text: "Made in India", href: "/about" },
  { icon: "leaf", text: "Natural Ingredients", href: "/research" },
  { icon: "truck", text: "Free Shipping ₹999+", href: "/shipping-policy" },
  { icon: "beaker", text: "5 Years R&D", href: "/research" },
] as const;

export default function HeroTrustBar() {
  return (
    <div
      className="border-b border-green-100/80 bg-gradient-to-b from-cream-50/90 to-white py-3.5"
      role="navigation"
      aria-label="Brand trust highlights"
    >
      <div className="mx-auto max-w-7xl px-4">
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 md:gap-x-8">
          {TRUST_ITEMS.map((item) => (
            <li key={item.text}>
              <Link
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-1 py-1 text-xs font-semibold text-green-800 transition-colors hover:text-terra-700 md:text-sm",
                  focusRing,
                )}
              >
                <TrustIcon name={item.icon} className={cn(trustIconSize, "text-green-700")} />
                <span>{item.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
