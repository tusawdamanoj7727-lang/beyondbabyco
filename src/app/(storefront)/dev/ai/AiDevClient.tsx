"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";

import Button from "@/components/ui/Button";
import { AI_IMAGE_PRESETS } from "@/lib/ai/preset-definitions";
import { runAiPresetAction } from "@/lib/ai/preset-actions";
import type { AiImagePresetId } from "@/lib/ai/preset-definitions";
import { IMAGE_CATEGORIES, type ImageCategory } from "@/lib/ai/types";

type HistoryEntry = {
  id: string;
  prompt: string;
  publicPath: string;
  seed: number;
  durationMs: number;
  createdAt: string;
};

const HISTORY_KEY = "bbc_ai_dev_history";

function readHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entry: HistoryEntry) {
  const next = [entry, ...readHistory().filter((h) => h.id !== entry.id)].slice(0, 20);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export default function AiDevClient() {
  const [prompt, setPrompt] = useState(
    "Premium baby care product photography, soft natural light, cream and green palette, minimal studio, 4k",
  );
  const [negativePrompt, setNegativePrompt] = useState("");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [seed, setSeed] = useState<number | "">("");
  const [steps, setSteps] = useState(4);
  const [category, setCategory] = useState<ImageCategory>("temporary");
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<{ available: boolean; url: string; latencyMs?: number } | null>(
    null,
  );
  const [preview, setPreview] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const refreshHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/dev/ai-health");
      const data = (await res.json()) as {
        ok?: boolean;
        data?: { health?: typeof health };
        error?: string;
      };
      setHealth(data.data?.health ?? { available: false, url: "http://127.0.0.1:8188" });
    } catch {
      setHealth({ available: false, url: "http://127.0.0.1:8188" });
    }
  }, []);

  useEffect(() => {
    setHistory(readHistory());
    void refreshHealth();
  }, [refreshHealth]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dev/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          negativePrompt: negativePrompt || undefined,
          width,
          height,
          seed: seed === "" ? undefined : Number(seed),
          steps,
          category,
          filename: filename || undefined,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: {
          result?: {
            publicPath: string;
            seed: number;
            durationMs: number;
            prompt: string;
          };
        };
      };

      if (!res.ok || !data.ok || !data.data?.result) {
        throw new Error(data.error ?? "Generation failed");
      }

      const entry: HistoryEntry = {
        id: `${Date.now()}-${data.data.result.seed}`,
        prompt: data.data.result.prompt,
        publicPath: data.data.result.publicPath,
        seed: data.data.result.seed,
        durationMs: data.data.result.durationMs,
        createdAt: new Date().toISOString(),
      };

      setPreview(entry);
      setHistory(saveHistory(entry));
      void refreshHealth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePreset(presetId: AiImagePresetId) {
    setLoading(true);
    setError(null);
    try {
      const data = await runAiPresetAction(presetId, prompt.trim() || undefined);
      if (!data.ok) {
        throw new Error(data.error);
      }
      const entry: HistoryEntry = {
        id: `${Date.now()}-${data.result.seed}`,
        prompt: data.result.prompt,
        publicPath: data.result.publicPath,
        seed: data.result.seed,
        durationMs: data.result.durationMs,
        createdAt: new Date().toISOString(),
      };
      setPreview(entry);
      setHistory(saveHistory(entry));
      void refreshHealth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preset generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <section className="rounded-3xl border border-green-100 bg-white p-6 shadow-card">
          <h2 className="font-heading text-lg font-bold text-green-900">Catalog asset presets</h2>
          <p className="mt-1 text-sm text-green-700/80">
            One-click placeholders for hero, lifestyle, category, and marketing assets.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {AI_IMAGE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={loading}
                onClick={() => void handlePreset(preset.id)}
                className="rounded-2xl border border-cream-200 bg-cream-50/50 px-4 py-3 text-left transition-colors hover:border-green-300 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500"
              >
                <span className="font-semibold text-green-900">{preset.label}</span>
                <span className="mt-1 block text-xs text-green-700/70">{preset.description}</span>
              </button>
            ))}
          </div>
        </section>

      <form onSubmit={handleGenerate} className="space-y-5 rounded-3xl border border-green-100 bg-white p-6 shadow-card">
        <div>
          <label htmlFor="prompt" className="block text-sm font-semibold text-green-900">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            required
            className="mt-2 w-full rounded-2xl border border-cream-300 px-4 py-3 text-sm text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500/60"
          />
        </div>

        <div>
          <label htmlFor="negative" className="block text-sm font-semibold text-green-900">
            Negative prompt
          </label>
          <textarea
            id="negative"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-2xl border border-cream-300 px-4 py-3 text-sm text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500/60"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-green-900">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ImageCategory)}
              className="mt-2 h-11 w-full rounded-2xl border border-cream-300 px-3 text-sm"
            >
              {IMAGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filename" className="block text-sm font-semibold text-green-900">
              Filename (optional)
            </label>
            <input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="auto-generated if empty"
              className="mt-2 h-11 w-full rounded-2xl border border-cream-300 px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="width" className="block text-sm font-semibold text-green-900">
              Width
            </label>
            <input
              id="width"
              type="number"
              min={256}
              max={2048}
              step={64}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="mt-2 h-11 w-full rounded-2xl border border-cream-300 px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-semibold text-green-900">
              Height
            </label>
            <input
              id="height"
              type="number"
              min={256}
              max={2048}
              step={64}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="mt-2 h-11 w-full rounded-2xl border border-cream-300 px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="seed" className="block text-sm font-semibold text-green-900">
              Seed (optional)
            </label>
            <input
              id="seed"
              type="number"
              min={0}
              value={seed}
              onChange={(e) => setSeed(e.target.value === "" ? "" : Number(e.target.value))}
              className="mt-2 h-11 w-full rounded-2xl border border-cream-300 px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="steps" className="block text-sm font-semibold text-green-900">
              Steps
            </label>
            <input
              id="steps"
              type="number"
              min={1}
              max={50}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="mt-2 h-11 w-full rounded-2xl border border-cream-300 px-3 text-sm"
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-2xl bg-terra-50 px-4 py-3 text-sm text-terra-800" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Generate image
        </Button>
      </form>
      </div>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-card">
          <h2 className="font-heading text-lg font-bold text-green-900">ComfyUI status</h2>
          <p className="mt-2 text-sm text-green-700/80">
            {health?.available ? (
              <>
                <span className="font-semibold text-green-600">Online</span>
                {health.latencyMs != null ? ` · ${health.latencyMs}ms` : null}
              </>
            ) : (
              <span className="font-semibold text-terra-600">Offline — run npm run ai:start</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => void refreshHealth()}
            className="mt-3 text-sm font-semibold text-terra-600 hover:underline"
          >
            Refresh
          </button>
        </div>

        {preview ? (
          <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-card">
            <h2 className="font-heading text-lg font-bold text-green-900">Preview</h2>
            <div className="relative mt-3 aspect-square overflow-hidden rounded-2xl bg-cream-50">
              <Image
                src={preview.publicPath}
                alt="Generated preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="mt-3 text-xs text-green-700/70">
              Seed {preview.seed} · {(preview.durationMs / 1000).toFixed(1)}s
            </p>
            <a
              href={preview.publicPath}
              download
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-terra-600 hover:underline"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          </div>
        ) : null}

        {history.length > 0 ? (
          <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-card">
            <h2 className="font-heading text-lg font-bold text-green-900">History</h2>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {history.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setPreview(item)}
                    className="w-full rounded-xl border border-cream-200 px-3 py-2 text-left text-xs hover:bg-green-50"
                  >
                    <span className="line-clamp-2 font-medium text-green-900">{item.prompt}</span>
                    <span className="mt-1 block text-green-600/70">{item.publicPath}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>

      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm lg:hidden">
          <div className="flex items-center gap-2 rounded-2xl bg-white px-5 py-4 shadow-clay">
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            <span className="text-sm font-medium text-green-900">Generating…</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
