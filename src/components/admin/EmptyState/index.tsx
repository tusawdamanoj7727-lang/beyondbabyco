import type { ReactNode } from "react";

import Icon, { type IconName } from "../Icon";
import Mascot, { type MascotPose } from "@/components/mascots/Mascot";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Show a line icon (ignored when `mascot` is set). */
  icon?: IconName;
  /** Show a friendly mascot instead of an icon. */
  mascot?: boolean;
  mascotPose?: MascotPose;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon = "sparkles",
  mascot = false,
  mascotPose = "reading",
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-cream-300 bg-cream-50/60 px-6 py-12 text-center",
        className,
      )}
    >
      {mascot ? (
        <Mascot mascot="bella-bunny" pose={mascotPose} size={96} />
      ) : (
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cream-100 text-green-600 ring-1 ring-cream-300">
          <Icon name={icon} size={26} />
        </span>
      )}
      <h3 className="mt-4 font-heading text-lg font-bold text-green-900">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-green-700/70">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
