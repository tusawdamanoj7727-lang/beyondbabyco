"use client";

import { type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";

import Button from "@/components/ui/Button";
import { Spinner } from "../LoadingState";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-green-900/40 backdrop-blur-sm data-[state=open]:animate-[fadeIn_150ms_ease-out]" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-4xl border border-cream-300 bg-white p-6 shadow-clay focus:outline-none",
          )}
        >
          <Dialog.Title className="font-heading text-lg font-bold text-green-900">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1.5 text-sm text-green-700/70">
              {description}
            </Dialog.Description>
          )}

          <div className="mt-6 flex justify-end gap-2.5">
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm" disabled={loading}>
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              variant={tone === "danger" ? "cta" : "primary"}
              size="sm"
              onClick={onConfirm}
              disabled={loading}
              leftIcon={loading ? <Spinner size={16} className="border-white/50 border-t-white" /> : undefined}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
