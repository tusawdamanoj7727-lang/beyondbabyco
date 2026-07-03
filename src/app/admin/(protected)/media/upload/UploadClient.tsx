"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Icon from "@/components/admin/Icon";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/admin/LoadingState";
import { Select } from "@/components/admin/FormField";
import { cn } from "@/lib/utils";
import { readImageMeta } from "@/lib/media/image-meta";
import { MEDIA_BUCKETS } from "@/lib/admin/media-types";
import { uploadMedia } from "@/lib/admin/media-library-actions";

interface FolderOption {
  id: string;
  name: string;
  pathPrefix: string;
}

type Status = "queued" | "uploading" | "done" | "error" | "cancelled";

interface QueueItem {
  id: string;
  file: File;
  status: Status;
  error?: string;
  previewUrl?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

export default function UploadClient({ folders }: { folders: FolderOption[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelled = useRef<Set<string>>(new Set());

  const [bucket, setBucket] = useState<string>("media");
  const [folderId, setFolderId] = useState<string>("");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: QueueItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      file,
      status: "queued",
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setItems((prev) => [...prev, ...next]);
  }

  function update(id: string, patch: Partial<QueueItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    cancelled.current.add(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  async function uploadOne(item: QueueItem) {
    if (cancelled.current.has(item.id)) return;
    update(item.id, { status: "uploading", error: undefined });

    const folder = folders.find((f) => f.id === folderId);
    const fd = new FormData();
    fd.append("file", item.file);
    fd.append("bucket", folder ? "media" : bucket);
    if (folder) {
      fd.append("folderId", folder.id);
      fd.append("pathPrefix", folder.pathPrefix);
    }
    const meta = await readImageMeta(item.file);
    if (meta) {
      fd.append("width", String(meta.width));
      fd.append("height", String(meta.height));
      if (meta.blur) fd.append("blur", meta.blur);
    }

    try {
      const res = await uploadMedia(fd);
      if (cancelled.current.has(item.id)) return;
      if (res.ok) update(item.id, { status: "done" });
      else update(item.id, { status: "error", error: res.error ?? "Upload failed" });
    } catch (err) {
      if (cancelled.current.has(item.id)) return;
      update(item.id, { status: "error", error: err instanceof Error ? err.message : "Upload failed" });
    }
  }

  async function startAll() {
    setBusy(true);
    // Snapshot of items needing upload.
    const queue = items.filter((it) => it.status === "queued" || it.status === "error");
    for (const it of queue) {
      if (cancelled.current.has(it.id)) continue;
      await uploadOne(it);
    }
    setBusy(false);
    router.refresh();
  }

  const pendingCount = items.filter((i) => i.status === "queued" || i.status === "error").length;
  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div className="space-y-5">
      {/* Destination */}
      <div className="grid grid-cols-1 gap-4 rounded-3xl border border-cream-300 bg-white p-5 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-green-900">Bucket</span>
          <Select value={bucket} onChange={(e) => setBucket(e.target.value)} disabled={!!folderId} aria-label="Destination bucket">
            {MEDIA_BUCKETS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-green-900">Custom folder (optional)</span>
          <Select value={folderId} onChange={(e) => setFolderId(e.target.value)} aria-label="Destination folder">
            <option value="">— None —</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </Select>
        </label>
      </div>

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
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragOver ? "border-green-500 bg-green-50" : "border-cream-300 bg-cream-50/60",
        )}
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cream-100 text-green-600 ring-1 ring-cream-300">
          <Icon name="media" size={26} />
        </span>
        <p className="mt-3 font-semibold text-green-900">Drag &amp; drop files here</p>
        <p className="text-xs text-green-700/60">Images, video, PDFs and documents · multiple files supported</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-green-500 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
        >
          <Icon name="plus" size={16} /> Browse files
        </button>
        <input ref={inputRef} type="file" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
      </div>

      {/* Queue */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-green-700/70">
              {items.length} file{items.length === 1 ? "" : "s"} · {doneCount} uploaded
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { items.forEach((i) => cancelled.current.add(i.id)); setItems([]); }} disabled={busy}>
                Clear all
              </Button>
              <Button variant="primary" size="sm" onClick={startAll} disabled={busy || pendingCount === 0} leftIcon={busy ? <Spinner size={15} className="border-white/50 border-t-white" /> : <Icon name="external" size={15} />}>
                {busy ? "Uploading…" : `Upload ${pendingCount || ""}`.trim()}
              </Button>
            </div>
          </div>

          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 rounded-2xl border border-cream-300 bg-white p-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                  {it.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.previewUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-green-700/40">
                      <Icon name="blog" size={20} />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-green-900">{it.file.name}</p>
                  <p className="text-xs text-green-700/60">{formatBytes(it.file.size)}</p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-cream-200" role="progressbar" aria-label="Upload progress">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        it.status === "done" && "w-full bg-green-500",
                        it.status === "uploading" && "w-3/4 animate-pulse bg-green-400",
                        it.status === "error" && "w-full bg-terra-500",
                        (it.status === "queued" || it.status === "cancelled") && "w-0 bg-green-400",
                      )}
                    />
                  </div>
                  {it.error && <p className="mt-1 text-xs font-medium text-terra-600">{it.error}</p>}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <StatusPill status={it.status} />
                  {it.status === "error" && (
                    <button type="button" onClick={() => uploadOne(it)} aria-label="Retry upload" className="grid h-8 w-8 place-items-center rounded-lg border border-cream-300 text-green-700 hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
                      <Icon name="activity" size={15} />
                    </button>
                  )}
                  {it.status !== "done" && (
                    <button type="button" onClick={() => removeItem(it.id)} aria-label="Cancel / remove" className="grid h-8 w-8 place-items-center rounded-lg border border-terra-200 text-terra-600 hover:bg-terra-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
                      <Icon name="close" size={15} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" size="md" onClick={() => router.push("/admin/media")}>
          Back to library
        </Button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string }> = {
    queued: { label: "Queued", cls: "bg-cream-200 text-green-700" },
    uploading: { label: "Uploading", cls: "bg-green-100 text-green-700" },
    done: { label: "Done", cls: "bg-green-500 text-cream-50" },
    error: { label: "Failed", cls: "bg-terra-100 text-terra-700" },
    cancelled: { label: "Cancelled", cls: "bg-cream-200 text-green-700/60" },
  };
  const s = map[status];
  return <span className={cn("hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline-block", s.cls)}>{s.label}</span>;
}
