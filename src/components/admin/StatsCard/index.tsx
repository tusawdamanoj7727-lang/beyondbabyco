import Card from "@/components/ui/Card";
import Icon, { type IconName } from "../Icon";
import { cn } from "@/lib/utils";

export interface StatsCardProps {
  label: string;
  value: string;
  icon: IconName;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  /** Premium glass styling for dashboard metrics. */
  glass?: boolean;
}

export default function StatsCard({
  label,
  value,
  icon,
  hint,
  trend,
  glass = false,
}: StatsCardProps) {
  return (
    <Card
      variant={glass ? "glass" : "default"}
      padding="md"
      radius="3xl"
      hover
      fullHeight
      className={glass ? "border border-white/80 shadow-clay" : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-green-700/70">{label}</p>
          <p className="mt-2 font-heading text-3xl font-bold tracking-tight text-green-900">
            {value}
          </p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cream-100 text-green-600 ring-1 ring-cream-300">
          <Icon name={icon} size={22} />
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {trend && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              trend.positive
                ? "bg-green-100 text-green-700"
                : "bg-terra-50 text-terra-700",
            )}
          >
            {trend.value}
          </span>
        )}
        {hint && <span className="text-xs text-green-700/50">{hint}</span>}
      </div>
    </Card>
  );
}
