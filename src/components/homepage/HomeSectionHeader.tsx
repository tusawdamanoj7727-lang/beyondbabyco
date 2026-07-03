import type { ReactNode } from "react";

import AccentBar from "@/components/ui/AccentBar";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type HomeSectionHeaderProps = {
  eyebrow: string;
  heading: ReactNode;
  intro?: string;
  align?: "center" | "left";
  className?: string;
};

function renderHeading(heading: ReactNode) {
  if (typeof heading !== "string") return heading;
  if (!heading.includes("\n")) return heading;
  return heading.split("\n").map((line, i, arr) => (
    <span key={`${line}-${i}`}>
      {line}
      {i < arr.length - 1 ? <br /> : null}
    </span>
  ));
}

/** Unified homepage section header — one typography + spacing grid. */
export default function HomeSectionHeader({
  eyebrow,
  heading,
  intro,
  align = "center",
  className,
}: HomeSectionHeaderProps) {
  const centered = align === "center";

  return (
    <header
      className={cn(
        "homepage-section-header",
        centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl text-left",
        className,
      )}
    >
      <Badge variant="default" size="md">
        {eyebrow}
      </Badge>
      <h2 className="section-heading homepage-section-title">{renderHeading(heading)}</h2>
      <AccentBar width="lg" align={centered ? "center" : "left"} className="homepage-section-accent" />
      {intro ? (
        <p className={cn("section-subcopy homepage-section-intro prose-measure", centered && "mx-auto")}>
          {intro}
        </p>
      ) : null}
    </header>
  );
}
