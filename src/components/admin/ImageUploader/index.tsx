"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import Icon from "../Icon";
import Badge from "@/components/ui/Badge";
import { Spinner } from "../LoadingState";
import ConfirmDialog from "../ConfirmDialog";
import { fieldControlClasses } from "../FormField";
import {
  deleteProductImage,
  reorderProductImages,
  setPrimaryImage,
  updateProductImageAlt,
  uploadProductImage,
} from "@/lib/admin/product-actions";
import type { ProductImageRecord } from "@/lib/admin/products";
import { validateImageUpload, ALLOWED_IMAGE_ACCEPT } from "@/lib/media/upload-validation";
import { cn } from "@/lib/utils";

export default function ImageUploader({
  productId,
  initialImages,
}: {
  productId: string;
  initialImages: ProductImageRecord[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductImageRecord | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setImages(initialImages), [initialImages]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const typeError = validateImageUpload(file);
        if (typeError) {
          setError(typeError);
          continue;
        }
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadProductImage(productId, fd);
        if (!res.ok) setError(res.error ?? "Upload failed");
      }
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
    startTransition(async () => {
      await reorderProductImages(productId, next.map((i) => i.id));
      router.refresh();
    });
  }

  function makePrimary(id: string) {
    startTransition(async () => {
      await setPrimaryImage(id, productId);
      router.refresh();
    });
  }

  function saveAlt(id: string, alt: string) {
    startTransition(async () => {
      await updateProductImageAlt(id, productId, alt);
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    startTransition(async () => {
      await deleteProductImage(id, productId);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-green-500 bg-green-50" : "border-cream-300 bg-cream-50/60",
        )}
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cream-100 text-green-600 ring-1 ring-cream-300">
          <Icon name="media" size={24} />
        </span>
        <p className="mt-3 text-sm font-semibold text-green-900">
          Drag &amp; drop images here
        </p>
        <p className="text-xs text-green-700/60">PNG, JPG, or WebP · uploaded to the products bucket</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-green-500 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
        >
          {uploading ? <Spinner size={16} /> : <Icon name="plus" size={16} />}
          {uploading ? "Uploading…" : "Browse files"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-sm font-medium text-terra-600" role="alert">
          {error}
        </p>
      )}

      {/* Gallery */}
      {images.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {images.map((img, index) => (
            <li
              key={img.id}
              className="flex gap-3 rounded-2xl border border-cream-300 bg-white p-3"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                {img.isPrimary && (
                  <span className="absolute left-1 top-1">
                    <Badge variant="success" size="sm">Primary</Badge>
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <input
                  type="text"
                  defaultValue={img.alt ?? ""}
                  placeholder="Alt text (accessibility / SEO)"
                  aria-label={`Alt text for image ${index + 1}`}
                  onBlur={(e) => {
                    if (e.target.value !== (img.alt ?? "")) saveAlt(img.id, e.target.value);
                  }}
                  className={cn(fieldControlClasses, "py-1.5 text-xs")}
                />
                <div className="mt-auto flex flex-wrap items-center gap-1">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0 || isPending} aria-label="Move up" className="grid h-8 w-8 place-items-center rounded-lg border border-cream-300 text-green-700 hover:bg-cream-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
                    <Icon name="chevronLeft" size={15} className="rotate-90" />
                  </button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1 || isPending} aria-label="Move down" className="grid h-8 w-8 place-items-center rounded-lg border border-cream-300 text-green-700 hover:bg-cream-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
                    <Icon name="chevronRight" size={15} className="rotate-90" />
                  </button>
                  {!img.isPrimary && (
                    <button type="button" onClick={() => makePrimary(img.id)} disabled={isPending} className="rounded-lg border border-cream-300 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-cream-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
                      Set primary
                    </button>
                  )}
                  <button type="button" onClick={() => setDeleteTarget(img)} disabled={isPending} aria-label="Delete image" className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-terra-200 text-terra-600 hover:bg-terra-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
                    <Icon name="close" size={15} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        tone="danger"
        title="Delete image?"
        description="This permanently removes the image from storage and the product gallery."
        confirmLabel="Delete"
        loading={isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
