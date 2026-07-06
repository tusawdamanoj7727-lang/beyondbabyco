const TRUST_ITEMS = [
  { icon: "✓", label: "Dermatologically Tested" },
  { icon: "✓", label: "Made in India" },
  { icon: "✓", label: "5 Years R&D" },
  { icon: "✓", label: "Paraben Free" },
  { icon: "🚚", label: "Free Ship ₹999+" },
] as const;

export default function HeroTrustBar() {
  return (
    <div className="border-b border-[#eaf3de] bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-4">
        {TRUST_ITEMS.map((item) => (
          <span
            key={item.label}
            className="flex items-center gap-2 text-sm font-medium text-gray-600"
          >
            <span className="text-[#2d5a27]" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
