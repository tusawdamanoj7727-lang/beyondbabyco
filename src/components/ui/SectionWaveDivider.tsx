import { cn } from "@/lib/utils";

type SectionWaveDividerProps = {
  fill?: string;
  className?: string;
  flip?: boolean;
};

/** Soft wave transition between homepage sections. */
export default function SectionWaveDivider({
  fill = "var(--brand-cream)",
  className,
  flip = false,
}: SectionWaveDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("-mb-1 w-full overflow-hidden leading-none", flip && "rotate-180", className)}
    >
      <svg
        viewBox="0 0 1440 40"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="h-8 w-full"
        style={{ fill }}
      >
        <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" />
      </svg>
    </div>
  );
}
