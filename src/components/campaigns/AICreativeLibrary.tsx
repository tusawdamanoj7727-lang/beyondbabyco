"use client";

import { useState, useTransition } from "react";

import Button from "@/components/ui/Button";
import { generateCampaignCreative } from "@/lib/admin/campaign-center-actions";
import { AI_CREATIVE_FORMATS, MARKETING_MEDIA_FOLDER } from "@/lib/campaigns/types";
import type { AiImagePresetId } from "@/lib/ai/preset-definitions";
import { cn } from "@/lib/utils";

export default function AICreativeLibrary({
  campaignId,
  existingCreatives,
  className,
}: {
  campaignId: string | null;
  existingCreatives: { id: string; format: string; url: string; prompt?: string; createdAt: string }[];
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [prompt, setPrompt] = useState("");
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function generate(formatId: string, preset: AiImagePresetId) {
    setError(null);
    startTransition(async () => {
      const res = await generateCampaignCreative(campaignId, formatId, preset, prompt || undefined);
      if (!res.ok) setError(res.error ?? "Generation failed");
      else if (res.url) setLastUrl(res.url);
    });
  }

  return (
    <div className={cn("space-y-6", className)}>
      <header>
        <h3 className="font-heading text-lg font-bold text-green-900">AI Creative Library</h3>
        <p className="mt-1 text-sm text-green-700/70">
          Generate campaign assets via ComfyUI. Outputs save to{" "}
          <code className="rounded bg-cream-100 px-1.5 py-0.5 text-xs">public/images/generated/marketing/</code> (
          {MARKETING_MEDIA_FOLDER} folder).
        </p>
      </header>

      <label className="block">
        <span className="text-sm font-semibold text-green-900">Custom prompt (optional)</span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          placeholder="Premium baby care campaign, soft cream tones, no text…"
          className="mt-1 w-full rounded-2xl border border-cream-200 px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
        />
      </label>

      {error ? <p className="text-sm text-terra-600" role="alert">{error}</p> : null}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AI_CREATIVE_FORMATS.map((fmt) => (
          <li key={fmt.id} className="rounded-2xl border border-cream-200 bg-white p-4">
            <p className="font-semibold text-green-900">{fmt.label}</p>
            <p className="text-xs text-green-700/50">
              {fmt.width}×{fmt.height}
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3 w-full"
              disabled={pending}
              onClick={() => generate(fmt.id, fmt.preset)}
            >
              {pending ? "Generating…" : "Generate"}
            </Button>
          </li>
        ))}
      </ul>

      {lastUrl ? (
        <div className="rounded-2xl border border-green-200 bg-green-50/40 p-4">
          <p className="text-sm font-semibold text-green-900">Latest generation</p>
          <a href={lastUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm text-terra-600 hover:underline">
            {lastUrl}
          </a>
        </div>
      ) : null}

      {existingCreatives.length > 0 ? (
        <section aria-labelledby="existing-creatives-heading">
          <h4 id="existing-creatives-heading" className="font-heading text-sm font-bold text-green-900">
            Campaign creatives
          </h4>
          <ul className="mt-3 space-y-2">
            {existingCreatives.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-cream-200 px-3 py-2 text-sm">
                <span className="font-medium text-green-900">{c.format}</span>
                <a href={c.url} target="_blank" rel="noreferrer" className="truncate text-terra-600 hover:underline">
                  View
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
