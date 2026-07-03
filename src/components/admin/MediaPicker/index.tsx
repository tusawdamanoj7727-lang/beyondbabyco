"use client";

import { useEffect, useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";

import Button from "@/components/ui/Button";
import Icon from "../Icon";
import { Input } from "../FormField";
import { Spinner } from "../LoadingState";
import { searchMediaImages, type PickerAsset } from "@/lib/admin/homepage-actions";
import { cn } from "@/lib/utils";

export interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
  /** Visible field label, used for the accessible dialog title. */
  label?: string;
  /** Square preview size in px. */
  size?: number;
}

/**
 * Choose an image from the existing Media Library. This never uploads —
 * assets must already exist in the library (Media Library handles uploads).
 */
export default function MediaPicker({ value, onChange, label = "Image", size = 96 }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<PickerAsset[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        setAssets(await searchMediaImages(query));
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [open, query]);

  return (
    <div className="flex items-start gap-3">
      <div
        className="grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-cream-300 bg-cream-100 text-green-700/30"
        style={{ width: size, height: size }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <Icon name="media" size={26} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
            {value ? "Change" : "Choose from Library"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              Remove
            </Button>
          )}
        </div>
        {value && <p className="max-w-xs break-all text-xs text-green-700/50">{value}</p>}
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[110] bg-green-900/40 backdrop-blur-sm" />
          <Dialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-[120] flex max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col",
              "rounded-4xl border border-cream-300 bg-white p-6 shadow-clay focus:outline-none",
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <Dialog.Title className="font-heading text-lg font-bold text-green-900">
                Choose {label} from Media Library
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="rounded-full p-1.5 text-green-700/60 hover:bg-cream-100"
                >
                  <Icon name="close" size={18} />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-1 text-sm text-green-700/60">
              Only assets already in the Media Library are shown.
            </Dialog.Description>

            <div className="mt-4">
              <Input
                type="search"
                placeholder="Search images…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search images"
              />
            </div>

            <div className="mt-4 min-h-[12rem] flex-1 overflow-y-auto">
              {pending ? (
                <div className="grid place-items-center py-12">
                  <Spinner size={26} />
                </div>
              ) : assets.length === 0 ? (
                <p className="py-12 text-center text-sm text-green-700/60">
                  No images found. Upload assets in the Media Library first.
                </p>
              ) : (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {assets.map((asset) => (
                    <li key={asset.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(asset.url);
                          setOpen(false);
                        }}
                        className={cn(
                          "group block w-full overflow-hidden rounded-2xl border bg-cream-100 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
                          value === asset.url ? "border-green-500 ring-2 ring-green-500/40" : "border-cream-300 hover:border-green-300",
                        )}
                        title={asset.name}
                      >
                        <span className="block aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={asset.url} alt={asset.name} loading="lazy" className="h-full w-full object-cover" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
