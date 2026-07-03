"use client";

import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import Button from "@/components/ui/Button";
import Icon from "@/components/admin/Icon";
import FormField, { Input, Select, Textarea, Checkbox } from "@/components/admin/FormField";
import { Spinner } from "@/components/admin/LoadingState";
import type { ActionResult } from "@/lib/admin/homepage-actions";

// ----------------------------- Save plumbing -----------------------------

export function useSaver() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const run = (fn: () => Promise<ActionResult>, onDone?: () => void) => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else {
        setSaved(true);
        onDone?.();
      }
    });
  };

  return { pending, error, saved, setSaved, run };
}

export function SectionShell({
  title,
  description,
  enabled,
  onToggleEnabled,
  pending,
  saved,
  error,
  dirty = true,
  onSave,
  children,
}: {
  title: string;
  description?: string;
  enabled?: boolean;
  onToggleEnabled?: (next: boolean) => void;
  pending: boolean;
  saved: boolean;
  error: string | null;
  dirty?: boolean;
  onSave: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-4xl border border-cream-300 bg-white shadow-card">
      <header className="flex flex-col gap-3 border-b border-cream-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-bold text-green-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-green-700/60">{description}</p>}
        </div>
        {typeof enabled === "boolean" && onToggleEnabled && (
          <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-3 py-1.5 text-sm font-medium text-green-900">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-cream-300 accent-green-600"
              checked={enabled}
              onChange={(e) => onToggleEnabled(e.target.checked)}
            />
            {enabled ? "Enabled" : "Disabled"}
          </label>
        )}
      </header>

      <div className="space-y-5 p-5">{children}</div>

      <footer className="flex items-center justify-between gap-3 border-t border-cream-200 p-5">
        <p className="text-sm" aria-live="polite">
          {error ? (
            <span className="font-medium text-terra-600">{error}</span>
          ) : saved ? (
            <span className="font-medium text-green-600">Saved.</span>
          ) : dirty ? (
            <span className="text-green-700/50">Unsaved changes</span>
          ) : (
            <span className="text-green-700/40">Up to date</span>
          )}
        </p>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={pending || !dirty}
          leftIcon={pending ? <Spinner size={16} className="border-white/50 border-t-white" /> : undefined}
        >
          Save changes
        </Button>
      </footer>
    </section>
  );
}

// ----------------------------- Field wrappers -----------------------------

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  description,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  description?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <FormField label={label} description={description} required={required}>
      <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </FormField>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  description?: string;
}) {
  return (
    <FormField label={label} description={description}>
      <Input
        type="number"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </FormField>
  );
}

export function AreaField({
  label,
  value,
  onChange,
  placeholder,
  description,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  description?: string;
  rows?: number;
}) {
  return (
    <FormField label={label} description={description}>
      <Textarea rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </FormField>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  description,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  description?: string;
}) {
  return (
    <FormField label={label} description={description}>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </FormField>
  );
}

export { Checkbox };

// ----------------------------- Array editor -----------------------------

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ArrayEditor<T>({
  items,
  onChange,
  newItem,
  renderItem,
  addLabel = "Add item",
  itemLabel = "Item",
}: {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  addLabel?: string;
  itemLabel?: string;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-cream-300 bg-cream-50 px-4 py-6 text-center text-sm text-green-700/50">
          No entries yet.
        </p>
      )}

      {items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-cream-300 bg-cream-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-green-700/60">
              {itemLabel} {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <IconBtn
                label="Move up"
                disabled={index === 0}
                onClick={() => onChange(move(items, index, index - 1))}
              >
                <Icon name="chevronDown" size={16} className="rotate-180" />
              </IconBtn>
              <IconBtn
                label="Move down"
                disabled={index === items.length - 1}
                onClick={() => onChange(move(items, index, index + 1))}
              >
                <Icon name="chevronDown" size={16} />
              </IconBtn>
              <IconBtn
                label="Remove"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <Icon name="close" size={16} />
              </IconBtn>
            </div>
          </div>
          {renderItem(
            item,
            (patch) => onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it))),
            index,
          )}
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" leftIcon={<Icon name="plus" size={16} />} onClick={() => onChange([...items, newItem()])}>
        {addLabel}
      </Button>
    </div>
  );
}

export function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg p-1.5 text-green-700/60 transition-colors hover:bg-cream-200 hover:text-green-900 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

// ----------------------------- Ordered multi-select -----------------------------

export function OrderedSelect({
  label,
  options,
  selected,
  onChange,
  description,
}: {
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  description?: string;
}) {
  const [pick, setPick] = useState("");
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o.name])), [options]);
  const remaining = options.filter((o) => !selected.includes(o.id));

  return (
    <FormField label={label} description={description}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={`Add to ${label}`}>
            <option value="">Select to add…</option>
            {remaining.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!pick}
            onClick={() => {
              if (pick && !selected.includes(pick)) onChange([...selected, pick]);
              setPick("");
            }}
          >
            Add
          </Button>
        </div>

        {selected.length === 0 ? (
          <p className="text-xs text-green-700/50">Nothing selected — newest items will be used as a fallback.</p>
        ) : (
          <ol className="space-y-2">
            {selected.map((id, index) => (
              <li
                key={id}
                className="flex items-center justify-between gap-2 rounded-xl border border-cream-300 bg-cream-50 px-3 py-2"
              >
                <span className="truncate text-sm text-green-900">
                  {index + 1}. {byId.get(id) ?? "Unknown"}
                </span>
                <div className="flex items-center gap-1">
                  <IconBtn label="Move up" disabled={index === 0} onClick={() => onChange(move(selected, index, index - 1))}>
                    <Icon name="chevronDown" size={16} className="rotate-180" />
                  </IconBtn>
                  <IconBtn
                    label="Move down"
                    disabled={index === selected.length - 1}
                    onClick={() => onChange(move(selected, index, index + 1))}
                  >
                    <Icon name="chevronDown" size={16} />
                  </IconBtn>
                  <IconBtn label="Remove" onClick={() => onChange(selected.filter((s) => s !== id))}>
                    <Icon name="close" size={16} />
                  </IconBtn>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </FormField>
  );
}

/** Tracks whether a draft differs from the last-saved snapshot. */
export function useDirty<T>(value: T) {
  const savedRef = useRef(JSON.stringify(value));
  const dirty = JSON.stringify(value) !== savedRef.current;
  const markSaved = (next: T) => {
    savedRef.current = JSON.stringify(next);
  };
  return { dirty, markSaved };
}
