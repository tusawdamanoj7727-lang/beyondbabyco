import type { ReactNode } from "react";

import { Mascot } from "@/components/mascots";
import { surfaceGlassStrong, textBody, textSubheading } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type MascotName = "bella-bunny" | "gigi-giraffe" | "poppy-panda" | "eli-elephant" | "penny-penguin";

export default function EmptyState({
  title,
  description,
  mascot = "poppy-panda",
  action,
  className,
}: {
  title: string;
  description: string;
  mascot?: MascotName;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mx-auto flex max-w-xl flex-col items-center px-4 py-8 text-center", className)}
      role="status"
    >
      <div className={cn(surfaceGlassStrong, "w-full rounded-4xl px-6 py-10 sm:px-10")}>
        <div className="relative mx-auto flex h-32 items-center justify-center">
          <Mascot mascot={mascot} pose="welcome" size={96} animated floating alt="" />
        </div>
        <h3 className={cn(textSubheading, "mt-6")}>{title}</h3>
        <p className={cn(textBody, "mx-auto mt-3 max-w-md")}>{description}</p>
        {action ? <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">{action}</div> : null}
      </div>
    </div>
  );
}
