import { cn } from "@/lib/utils";

export default function CourierBadge({
  name = "Delhivery",
  className,
}: {
  name?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200",
        className,
      )}
    >
      {name}
    </span>
  );
}
