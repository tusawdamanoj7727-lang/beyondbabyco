"use client";

import { useEffect, useState } from "react";

import Button from "@/components/ui/Button";
import type { ReportFilters } from "@/lib/admin/report-types";
import type { SavedAnalyticsView } from "@/lib/analytics/types";

const STORAGE_KEY = "beyondbabyco-analytics-views";

export default function AnalyticsSavedViews({
  path,
  filters,
}: {
  path: string;
  filters: ReportFilters;
}) {
  const [views, setViews] = useState<SavedAnalyticsView[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setViews(raw ? (JSON.parse(raw) as SavedAnalyticsView[]) : []);
    } catch {
      setViews([]);
    }
  }, []);

  function persist(next: SavedAnalyticsView[]) {
    setViews(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function saveView() {
    if (!name.trim()) return;
    const view: SavedAnalyticsView = {
      id: crypto.randomUUID(),
      name: name.trim(),
      path,
      filters,
      createdAt: new Date().toISOString(),
    };
    persist([view, ...views].slice(0, 10));
    setName("");
  }

  function applyView(view: SavedAnalyticsView) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(view.filters)) {
      if (v) sp.set(k, String(v));
    }
    window.location.href = `${view.path}?${sp.toString()}`;
  }

  function removeView(id: string) {
    persist(views.filter((v) => v.id !== id));
  }

  const pathViews = views.filter((v) => v.path === path);

  return (
    <div className="rounded-3xl border border-cream-200 bg-cream-50/50 p-4 dark:border-green-800 dark:bg-green-950/30">
      <h3 className="font-heading text-sm font-bold text-green-900 dark:text-cream-50">Saved views</h3>
      <p className="mt-1 text-xs text-green-700/60 dark:text-green-200/60">Stored locally in your browser.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="View name…"
          aria-label="Saved view name"
          className="min-w-[160px] flex-1 rounded-2xl border border-cream-200 px-3 py-2 text-sm dark:border-green-700 dark:bg-green-950 dark:text-cream-50"
        />
        <Button type="button" size="sm" onClick={saveView} disabled={!name.trim()}>
          Save
        </Button>
      </div>
      {pathViews.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {pathViews.map((v) => (
            <li key={v.id} className="inline-flex items-center gap-1 rounded-full border border-cream-200 bg-white pl-3 pr-1 dark:border-green-700 dark:bg-green-900">
              <button type="button" onClick={() => applyView(v)} className="text-xs font-semibold text-green-800 dark:text-green-100">
                {v.name}
              </button>
              <button type="button" onClick={() => removeView(v.id)} className="rounded-full px-2 py-1 text-xs text-terra-600" aria-label={`Remove ${v.name}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
