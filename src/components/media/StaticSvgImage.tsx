import { cn } from "@/lib/utils";

export function isStaticSvgUrl(src: string): boolean {
  const path = src.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  return path.endsWith(".svg");
}

type StaticSvgImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: "lazy" | "eager";
  /** When true, fills a relative parent (like next/image fill). */
  fill?: boolean;
};

/** Renders trusted static SVG assets without the Next.js Image optimizer. */
export default function StaticSvgImage({
  src,
  alt,
  width,
  height,
  className,
  loading = "lazy",
  fill = false,
}: StaticSvgImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={loading}
      decoding="async"
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
    />
  );
}
