import { cn } from "@/lib/utils";

type SectionWaveDividerProps = {
  fill?: string;
  className?: string;
  flip?: boolean;
};

/** Soft wave transition between homepage sections. */
export default function SectionWaveDivider({
  fill = "#faf5f0",
  className,
  flip = false,
}: SectionWaveDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("w-full overflow-hidden leading-none", flip && "rotate-180", className)}
    >
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="h-12 w-full" style={{ fill }}>
        <path d="M0,30 C300,60 900,0 1200,30 L1200,60 L0,60 Z" />
      </svg>
    </div>
  );
}
