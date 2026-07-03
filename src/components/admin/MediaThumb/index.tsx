"use client";

import Icon, { type IconName } from "../Icon";
import { mediaKind } from "@/lib/admin/media-types";
import { cn } from "@/lib/utils";

const FILE_ICON: Record<string, IconName> = {
  pdf: "blog",
  other: "media",
};

/**
 * Renders an appropriate preview for a media asset based on its mime type:
 * image, video, PDF or a generic file icon.
 */
export default function MediaThumb({
  url,
  mime,
  alt,
  full = false,
  className,
}: {
  url: string | null;
  mime: string | null;
  alt?: string | null;
  /** When true, renders a large interactive preview (image/video/pdf embed). */
  full?: boolean;
  className?: string;
}) {
  const kind = mediaKind(mime);

  if (kind === "image" && url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt ?? ""}
        loading="lazy"
        className={cn("h-full w-full bg-cream-100 object-cover", className)}
      />
    );
  }

  if (kind === "video" && url) {
    return full ? (
      <video src={url} controls className={cn("h-full w-full bg-black object-contain", className)} />
    ) : (
      <div className={cn("relative h-full w-full bg-green-900", className)}>
        <video src={url} muted className="h-full w-full object-cover opacity-80" />
        <span className="absolute inset-0 grid place-items-center text-cream-50">
          <Icon name="reviews" size={28} />
        </span>
      </div>
    );
  }

  if (kind === "pdf" && url && full) {
    return <iframe src={url} title={alt ?? "PDF preview"} className={cn("h-full w-full bg-white", className)} />;
  }

  return (
    <div className={cn("grid h-full w-full place-items-center bg-cream-100 text-green-700/40", className)}>
      <Icon name={FILE_ICON[kind] ?? "media"} size={full ? 64 : 26} />
    </div>
  );
}
