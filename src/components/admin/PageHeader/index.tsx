import type { ReactNode } from "react";

import Reveal from "@/components/ui/Reveal";

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions (buttons, etc.). */
  actions?: ReactNode;
  /** Optional eyebrow label shown above the title. */
  eyebrow?: string;
}

export default function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: PageHeaderProps) {
  return (
    <Reveal as="div" viewport={false}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.16em] text-green-600">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 font-heading text-2xl font-bold text-green-900 sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-green-700/70">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </Reveal>
  );
}
