"use client";

import { useEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";
import { ASPECT_PRESETS } from "@/lib/admin/product-media-sections";
import type { ProductImageRecord } from "@/lib/admin/products";
import type { MediaSectionId } from "@/lib/admin/product-media-sections";
import { uploadProductMedia, trashProductImage } from "@/lib/admin/product-media-actions";

interface Props {
  image: ProductImageRecord & { sectionId: MediaSectionId };
  productId: string;
  productName: string;
  productSlug: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ImageEditorModal({
  image,
  productId,
  productName,
  productSlug,
  onClose,
  onSaved,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [aspect, setAspect] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      draw();
    };
    img.src = image.url;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.url]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brightness, contrast, rotation, flipH, aspect]);

  function draw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cw = img.naturalWidth;
    let ch = img.naturalHeight;
    if (aspect) {
      const r = aspect;
      if (cw / ch > r) cw = ch * r;
      else ch = cw / r;
    }
    canvas.width = Math.min(cw, 1600);
    canvas.height = Math.min(ch, 1600 * (ch / cw));

    ctx.save();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, 1);
    ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.restore();
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.92));
      if (!blob) return;
      const file = new File([blob], `edited-${image.id}.webp`, { type: "image/webp" });
      const fd = new FormData();
      fd.append("file", file);
      fd.append("sectionId", image.sectionId);
      fd.append("alt", image.alt ?? "");
      await trashProductImage(image.id, productId, productSlug);
      await uploadProductMedia(productId, productName, productSlug, fd);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-green-950">Edit image</h2>
          <button type="button" onClick={onClose} className="text-green-700">
            Close
          </button>
        </div>

        <canvas ref={canvasRef} className="mx-auto mt-4 max-h-[50vh] w-full rounded-xl border border-cream-300" />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Brightness
            <input type="range" min={50} max={150} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full" />
          </label>
          <label className="text-sm">
            Contrast
            <input type="range" min={50} max={150} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full" />
          </label>
          <label className="text-sm">
            Rotate
            <input type="range" min={0} max={270} step={90} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={flipH} onChange={(e) => setFlipH(e.target.checked)} />
            Flip horizontal
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {ASPECT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setAspect(p.ratio)}
              className="rounded-xl border border-cream-300 px-3 py-1 text-xs font-medium"
            >
              {p.label}
            </button>
          ))}
          <button type="button" onClick={() => setAspect(null)} className="rounded-xl border border-cream-300 px-3 py-1 text-xs">
            Free
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save as new version"}
          </Button>
        </div>
      </div>
    </div>
  );
}
