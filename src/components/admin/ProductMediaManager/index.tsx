"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "../ConfirmDialog";
import { fieldControlClasses } from "../FormField";
import ImageEditorModal from "./ImageEditorModal";
import type { ProductImageRecord } from "@/lib/admin/products";
import { sectionFromUrl } from "@/lib/admin/product-media-paths";
import {
  PRODUCT_MEDIA_SECTIONS,
  type MediaSectionId,
} from "@/lib/admin/product-media-sections";
import { suggestProductMediaSeo } from "@/lib/admin/product-media-seo";
import {
  detectImageAlpha,
  validateProductMedia,
  type MediaValidationIssue,
} from "@/lib/admin/product-media-validation";
import { readImageMeta } from "@/lib/media/image-meta";
import {
  bulkTrashProductImages,
  duplicateProductImage,
  moveProductImageSection,
  restoreProductImage,
  trashProductImage,
  updateProductMediaSeo,
  uploadProductMedia,
} from "@/lib/admin/product-media-actions";
import {
  deleteProductImage,
  reorderProductImages,
  setPrimaryImage,
} from "@/lib/admin/product-actions";
import { cn } from "@/lib/utils";

type QueueStatus = "queued" | "uploading" | "done" | "error" | "cancelled";

interface QueueItem {
  id: string;
  file: File;
  sectionId: MediaSectionId;
  status: QueueStatus;
  progress: number;
  error?: string;
  previewUrl?: string;
  warnings?: MediaValidationIssue[];
}

interface EnrichedImage extends ProductImageRecord {
  sectionId: MediaSectionId;
  trashed: boolean;
}

export default function ProductMediaManager({
  productId,
  productName,
  productSlug,
  initialImages,
}: {
  productId: string;
  productName: string;
  productSlug: string;
  initialImages: ProductImageRecord[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelled = useRef(new Set<string>());
  const [isPending, startTransition] = useTransition();

  const [activeSection, setActiveSection] = useState<MediaSectionId>("gallery");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [editorImage, setEditorImage] = useState<EnrichedImage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedImage | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [expandedSeo, setExpandedSeo] = useState<string | null>(null);

  const images: EnrichedImage[] = useMemo(
    () =>
      initialImages.map((img) => {
        const path = img.url;
        const trashed = path.includes("/.trash/");
        return {
          ...img,
          sectionId: sectionFromUrl(img.url, productId),
          trashed,
        };
      }),
    [initialImages, productId],
  );

  const activeImages = images.filter((i) => !i.trashed);
  const trashedImages = images.filter((i) => i.trashed);

  const sectionImages = useMemo(() => {
    const map = new Map<MediaSectionId, EnrichedImage[]>();
    for (const s of PRODUCT_MEDIA_SECTIONS) map.set(s.id, []);
    for (const img of activeImages) {
      const list = map.get(img.sectionId) ?? [];
      list.push(img);
      map.set(img.sectionId, list);
    }
    return map;
  }, [activeImages]);

  const addFiles = useCallback(
    async (files: FileList | File[] | null, sectionId: MediaSectionId = activeSection) => {
      if (!files?.length) return;
      const existingUrls = images.map((i) => i.url);
      const next: QueueItem[] = [];
      for (const file of Array.from(files)) {
        const meta = await readImageMeta(file);
        const hasAlpha = await detectImageAlpha(file);
        const warnings = validateProductMedia({
          file: { name: file.name, type: file.type, size: file.size },
          width: meta?.width,
          height: meta?.height,
          sectionId,
          existingUrls,
          hasAlpha,
        });
        next.push({
          id: crypto.randomUUID(),
          file,
          sectionId,
          status: "queued",
          progress: 0,
          previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
          warnings,
        });
      }
      setQueue((prev) => [...prev, ...next]);
    },
    [activeSection, images],
  );

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.files;
      if (items?.length) addFiles(items, activeSection);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [activeSection, addFiles]);

  async function uploadOne(item: QueueItem) {
    if (cancelled.current.has(item.id)) return;
    setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, status: "uploading", progress: 10 } : i)));

    const seo = suggestProductMediaSeo({
      productName,
      sectionId: item.sectionId,
      originalFilename: item.file.name,
    });
    const fd = new FormData();
    fd.append("file", item.file);
    fd.append("sectionId", item.sectionId);
    fd.append("alt", seo.alt);

    try {
      const res = await uploadProductMedia(productId, productName, productSlug, fd);
      if (cancelled.current.has(item.id)) return;
      if (res.ok) {
        setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, status: "done", progress: 100 } : i)));
      } else {
        setQueue((q) =>
          q.map((i) => (i.id === item.id ? { ...i, status: "error", error: res.error, progress: 0 } : i)),
        );
      }
    } catch (err) {
      setQueue((q) =>
        q.map((i) => ({
          ...i,
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
          progress: 0,
        })),
      );
    }
  }

  async function processQueue() {
    const pending = queue.filter((i) => i.status === "queued" || i.status === "error");
    for (const item of pending) {
      if (cancelled.current.has(item.id)) continue;
      await uploadOne(item);
    }
    router.refresh();
  }

  useEffect(() => {
    if (queue.some((i) => i.status === "queued")) processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length]);

  function onReorder(sectionId: MediaSectionId, ordered: EnrichedImage[]) {
    const ids = ordered.map((i) => i.id);
    startTransition(async () => {
      await reorderProductImages(productId, ids);
      router.refresh();
    });
  }

  function handleDropReorder(sectionId: MediaSectionId, targetId: string) {
    if (!dragId || dragId === targetId) return;
    const list = [...(sectionImages.get(sectionId) ?? [])];
    const from = list.findIndex((i) => i.id === dragId);
    const to = list.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    onReorder(sectionId, list);
    setDragId(null);
  }

  const currentSection = PRODUCT_MEDIA_SECTIONS.find((s) => s.id === activeSection)!;
  const currentList = sectionImages.get(activeSection) ?? [];

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files, activeSection);
        }}
        className={cn(
          "rounded-3xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragOver ? "border-green-500 bg-green-50" : "border-cream-300 bg-cream-50/60",
        )}
      >
        <p className="text-sm font-semibold text-green-900">
          Drop files into <span className="text-green-600">{currentSection.label}</span>
        </p>
        <p className="mt-1 text-xs text-green-700/70">
          Images, videos (MP4), PDFs · paste from clipboard · folder upload supported in Chrome
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
            Browse files
          </Button>
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value as MediaSectionId)}
            className={cn(fieldControlClasses, "w-auto text-sm")}
            aria-label="Upload destination section"
          >
            {PRODUCT_MEDIA_SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          accept="image/*,video/mp4,video/webm,application/pdf"
          onChange={(e) => addFiles(e.target.files, activeSection)}
          // @ts-expect-error webkitdirectory for folder upload
          webkitdirectory=""
          directory=""
        />
      </div>

      {/* Upload queue */}
      {queue.length > 0 && (
        <div className="rounded-2xl border border-cream-300 bg-white p-4">
          <h3 className="text-sm font-semibold text-green-900">Upload queue</h3>
          <ul className="mt-3 space-y-2">
            {queue.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                {item.previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.previewUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.file.name}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-200">
                    <div
                      className={cn(
                        "h-full transition-all",
                        item.status === "error" ? "bg-terra-500" : "bg-green-500",
                      )}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  {item.warnings?.map((w) => (
                    <p key={w.code} className={cn("text-xs", w.severity === "error" ? "text-terra-600" : "text-amber-700")}>
                      {w.message}
                    </p>
                  ))}
                  {item.error && <p className="text-xs text-terra-600">{item.error}</p>}
                </div>
                <span className="text-xs text-green-700/60">{item.status}</span>
                {(item.status === "queued" || item.status === "uploading") && (
                  <button
                    type="button"
                    onClick={() => {
                      cancelled.current.add(item.id);
                      setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, status: "cancelled" } : i)));
                    }}
                    className="text-xs text-terra-600"
                  >
                    Cancel
                  </button>
                )}
                {item.status === "error" && (
                  <button type="button" onClick={() => uploadOne(item)} className="text-xs text-green-700">
                    Retry
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bulk bar */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              startTransition(async () => {
                await bulkTrashProductImages(selected, productId, productSlug);
                setSelected([]);
                router.refresh();
              })
            }
          >
            Move to trash
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PRODUCT_MEDIA_SECTIONS.map((s) => {
          const count = sectionImages.get(s.id)?.length ?? 0;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "shrink-0 rounded-2xl px-3 py-2 text-xs font-semibold transition-colors",
                activeSection === s.id
                  ? "bg-green-600 text-white"
                  : "bg-cream-100 text-green-800 hover:bg-cream-200",
              )}
            >
              {s.label}
              {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Section gallery */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-green-950">{currentSection.label}</h3>
        {currentList.length === 0 ? (
          <p className="text-sm text-green-700/60">No assets in this section yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currentList.map((img) => (
              <li
                key={img.id}
                draggable
                onDragStart={() => setDragId(img.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropReorder(activeSection, img.id)}
                className={cn(
                  "rounded-2xl border border-cream-300 bg-white p-3",
                  dragId === img.id && "opacity-60",
                )}
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-cream-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                  {img.isPrimary && (
                    <Badge variant="success" size="sm" className="absolute left-2 top-2">
                      Primary
                    </Badge>
                  )}
                  <input
                    type="checkbox"
                    checked={selected.includes(img.id)}
                    onChange={(e) =>
                      setSelected((s) =>
                        e.target.checked ? [...s, img.id] : s.filter((id) => id !== img.id),
                      )
                    }
                    className="absolute right-2 top-2"
                    aria-label="Select image"
                  />
                </div>
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    className="text-xs font-medium text-green-700"
                    onClick={() => setExpandedSeo(expandedSeo === img.id ? null : img.id)}
                  >
                    SEO {expandedSeo === img.id ? "▲" : "▼"}
                  </button>
                  {expandedSeo === img.id && (
                    <div className="space-y-1 rounded-xl bg-cream-50 p-2 text-xs">
                      {(() => {
                        const seo = suggestProductMediaSeo({
                          productName,
                          sectionId: img.sectionId,
                          originalFilename: img.url.split("/").pop() ?? "image",
                        });
                        return (
                          <>
                            <label className="block">
                              Alt
                              <input
                                defaultValue={img.alt ?? seo.alt}
                                className={cn(fieldControlClasses, "mt-0.5 text-xs")}
                                onBlur={(e) =>
                                  startTransition(async () => {
                                    await updateProductMediaSeo(img.id, productId, productSlug, {
                                      alt: e.target.value,
                                    });
                                    router.refresh();
                                  })
                                }
                              />
                            </label>
                            <p className="text-green-700/70">Title: {seo.title}</p>
                            <p className="text-green-700/70">Keywords: {seo.keywords}</p>
                          </>
                        );
                      })()}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await setPrimaryImage(img.id, productId);
                            router.refresh();
                          })
                        }
                        className="rounded-lg border border-cream-300 px-2 py-1 text-xs"
                      >
                        Set primary
                      </button>
                    )}
                    <button type="button" onClick={() => setEditorImage(img)} className="rounded-lg border border-cream-300 px-2 py-1 text-xs">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(async () => {
                          await duplicateProductImage(img.id, productId, productSlug);
                          router.refresh();
                        })
                      }
                      className="rounded-lg border border-cream-300 px-2 py-1 text-xs"
                    >
                      Duplicate
                    </button>
                    <select
                      className="rounded-lg border border-cream-300 px-1 py-1 text-xs"
                      defaultValue=""
                      onChange={(e) => {
                        const v = e.target.value as MediaSectionId;
                        if (!v) return;
                        startTransition(async () => {
                          await moveProductImageSection(img.id, productId, productSlug, v);
                          router.refresh();
                        });
                        e.target.value = "";
                      }}
                      aria-label="Move to section"
                    >
                      <option value="">Move…</option>
                      {PRODUCT_MEDIA_SECTIONS.filter((s) => s.id !== activeSection).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(img)}
                      className="rounded-lg border border-terra-200 px-2 py-1 text-xs text-terra-600"
                    >
                      Trash
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Trash */}
      {trashedImages.length > 0 && (
        <div className="rounded-2xl border border-cream-300 bg-cream-50/80 p-4">
          <h3 className="text-sm font-semibold text-green-900">Trash ({trashedImages.length})</h3>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {trashedImages.map((img) => (
              <li key={img.id} className="rounded-xl border border-cream-300 bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="aspect-square w-full rounded-lg object-cover opacity-70" />
                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
                    className="text-xs text-green-700"
                    onClick={() =>
                      startTransition(async () => {
                        await restoreProductImage(img.id, productId, productSlug, "gallery");
                        router.refresh();
                      })
                    }
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    className="text-xs text-terra-600"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteProductImage(img.id, productId);
                        router.refresh();
                      })
                    }
                  >
                    Delete forever
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Ready */}
      <div className="rounded-3xl border border-dashed border-sage-300 bg-sage-50/50 p-6">
        <h3 className="font-semibold text-green-900">Generate Marketing Assets</h3>
        <p className="mt-2 text-sm text-green-800/80">
          Uses your uploaded packaging as reference to generate lifestyle images, ad creatives, social banners, and hero
          compositions. Packaging is never regenerated — your real product photos are preserved.
        </p>
        <Button type="button" variant="secondary" disabled className="mt-4">
          Coming soon — AI marketing asset generation
        </Button>
      </div>

      {editorImage && (
        <ImageEditorModal
          image={editorImage}
          productId={productId}
          productName={productName}
          productSlug={productSlug}
          onClose={() => setEditorImage(null)}
          onSaved={() => {
            setEditorImage(null);
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        tone="danger"
        title="Move to trash?"
        description="You can restore this asset from trash later."
        confirmLabel="Move to trash"
        loading={isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          startTransition(async () => {
            await trashProductImage(deleteTarget.id, productId, productSlug);
            setDeleteTarget(null);
            router.refresh();
          });
        }}
      />
    </div>
  );
}
