import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { INSTAGRAM_ARIA_LABEL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/brand/social";
import { cn } from "@/lib/utils";

type InstagramLinkProps = {
  variant?: "icon" | "with-handle";
  className?: string;
  iconClassName?: string;
};

export default function InstagramLink({
  variant = "icon",
  className,
  iconClassName = "h-5 w-5",
}: InstagramLinkProps) {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={INSTAGRAM_ARIA_LABEL}
      className={cn(
        "inline-flex items-center gap-2 text-green-700/90 transition-colors duration-200 hover:text-[#2d5a27]",
        className,
      )}
    >
      <InstagramIcon className={iconClassName} />
      {variant === "with-handle" ? (
        <span className="font-body text-sm font-medium">{INSTAGRAM_HANDLE}</span>
      ) : null}
    </a>
  );
}
