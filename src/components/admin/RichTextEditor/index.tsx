"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { fieldControlClasses } from "../FormField";

type Wrap = { before: string; after: string; placeholder: string };

const TOOLS: { label: string; title: string; wrap: Wrap }[] = [
  { label: "B", title: "Bold", wrap: { before: "**", after: "**", placeholder: "bold text" } },
  { label: "I", title: "Italic", wrap: { before: "_", after: "_", placeholder: "italic text" } },
  { label: "H", title: "Heading", wrap: { before: "## ", after: "", placeholder: "Heading" } },
  { label: "•", title: "Bullet list", wrap: { before: "- ", after: "", placeholder: "List item" } },
  { label: "🔗", title: "Link", wrap: { before: "[", after: "](https://)", placeholder: "link text" } },
];

export interface RichTextEditorProps {
  name: string;
  id?: string;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
  "aria-describedby"?: string;
}

export default function RichTextEditor({
  name,
  id,
  defaultValue,
  placeholder = "Write a rich description… Markdown supported.",
  rows = 8,
  ...aria
}: RichTextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");

  function applyWrap(wrap: Wrap) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || wrap.placeholder;
    const next = value.slice(0, start) + wrap.before + selected + wrap.after + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + wrap.before.length;
      el.setSelectionRange(cursor, cursor + selected.length);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-cream-300 bg-cream-50">
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex items-center gap-1 border-b border-cream-300 bg-white/60 px-2 py-1.5"
      >
        {TOOLS.map((tool) => (
          <button
            key={tool.title}
            type="button"
            title={tool.title}
            aria-label={tool.title}
            onClick={() => applyWrap(tool.wrap)}
            className="grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm font-bold text-green-800 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
          >
            {tool.label}
          </button>
        ))}
        <span className="ml-auto pr-1 text-[11px] font-medium text-green-700/40">Markdown</span>
      </div>
      <textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={cn(fieldControlClasses, "rounded-none border-0 bg-transparent focus:ring-0")}
        {...aria}
      />
    </div>
  );
}
