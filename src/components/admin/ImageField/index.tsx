"use client";

import { useRef, useState, useTransition } from "react";

import Icon from "../Icon";
import { Spinner } from "../LoadingState";
import { uploadMediaAsset, deleteMediaAsset } from "@/lib/admin/media-actions";
import { validateImageUpload, ALLOWED_IMAGE_ACCEPT } from "@/lib/media/upload-validation";
import type { MediaFolder } from "@/lib/admin/media";
import { cn } from "@/lib/utils";

/**
 * Single-image upload field for catalog taxonomy media slots
 * (category image/banner/icon, brand logo/banner).
 *
 * Uploads to the `media` bucket immediately and stores the resulting
 * public URL in a hidden input so it is persisted with the form submit.
 */
export default function ImageField({
  name,
  folder,
  initialUrl = null,
  aspect = "square",
  hint,
}: {
  name: string;
  folder: MediaFolder;
  initialUrl?: string | null;
  aspect?: "square" | "wide";
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const typeError = validateImageUpload(file);
    if (typeError) {
      setError(typeError);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadMediaAsset(folder, fd);
      if (res.ok && res.url) {
        setUrl(res.url);
      } else {
        setError(res.error ?? "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  }

  function remove() {
    const previous = url;
    setUrl(null);
    if (previous) startTransition(() => deleteMediaAsset(previous));
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url ?? ""} />

      {url ? (
        <div className="relative inline-block">
          <div
            className={cn(
              "overflow-hidden rounded-2xl border border-cream-300 bg-cream-100",
              aspect === "wide" ? "h-28 w-full" : "h-32 w-32",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-cream-100 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
            >
              {uploading ? <Spinner size={14} /> : <Icon name="media" size={14} />}
              Replace
            </button>
            <button
              type="button"
              onClick={remove}
              className="inline-flex items-center gap-1.5 rounded-xl border border-terra-200 px-3 py-1.5 text-xs font-semibold text-terra-600 transition-colors hover:bg-terra-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
            >
              <Icon name="close" size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
            dragOver ? "border-green-500 bg-green-50" : "border-cream-300 bg-cream-50/60 hover:border-green-300",
          )}
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cream-100 text-green-600 ring-1 ring-cream-300">
            {uploading ? <Spinner size={18} /> : <Icon name="media" size={20} />}
          </span>
          <span className="text-sm font-semibold text-green-900">
            {uploading ? "Uploading…" : "Upload image"}
          </span>
          <span className="text-xs text-green-700/60">
            {hint ?? "PNG, JPG or WebP · up to 5 MB"}
          </span>
        </button>
      )}

      {error && (
        <p className="text-xs font-medium text-terra-600" role="alert">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_ACCEPT}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
