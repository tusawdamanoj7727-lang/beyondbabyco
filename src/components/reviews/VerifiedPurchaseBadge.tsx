import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export default function VerifiedPurchaseBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-800 ring-1 ring-green-200",
        className,
      )}
      title="Verified purchase (UI preview — order verification connects when backend is ready)"
    >
      <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Verified Purchase</span>
    </span>
  );
}
