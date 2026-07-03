"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import Button from "@/components/ui/Button";
import { Mascot } from "@/components/mascots";
import { notifyMeAction, type NotifyMeState } from "@/lib/auth/notify-me-actions";
import { cn } from "@/lib/utils";
import { focusRing, surfaceGlassStrong } from "@/lib/design/ui";

const initialState: NotifyMeState = { error: null, success: null };

type NotifyMeDialogProps = {
  open: boolean;
  productName: string;
  interest?: string;
  onClose: () => void;
};

export default function NotifyMeDialog({
  open,
  productName,
  interest,
  onClose,
}: NotifyMeDialogProps) {
  const [state, formAction, isPending] = useActionState(notifyMeAction, initialState);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const emailId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (state.success) {
      const timer = window.setTimeout(onClose, 2400);
      return () => window.clearTimeout(timer);
    }
  }, [state.success, onClose]);

  if (!open && !state.success) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="notify-me-title"
      className={cn(
        surfaceGlassStrong,
        "fixed left-1/2 top-1/2 z-[120] w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-4xl border border-white/80 p-0 shadow-clay backdrop:bg-green-950/40 backdrop:backdrop-blur-sm",
      )}
      onClose={onClose}
    >
      <form action={formAction} className="p-6">
        <input type="hidden" name="product" value={productName} />
        {interest ? <input type="hidden" name="interest" value={interest} /> : null}

        <div className="flex flex-col items-center text-center">
          <Mascot mascot="penny-penguin" pose="hold-product" size={72} animated floating />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-green-600">Coming Soon</p>
          <h2 id="notify-me-title" className="mt-2 font-heading text-xl font-bold text-green-900">
            Notify me
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-green-700/80">
            Be first to know when <span className="font-semibold text-green-900">{productName}</span> launches
            in 2026.
          </p>
        </div>

        {state.success ? (
          <p role="status" className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            {state.success}
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {state.error ? (
              <p role="alert" className="rounded-2xl border border-terra-200 bg-terra-50 px-3 py-2 text-xs font-medium text-terra-700">
                {state.error}
              </p>
            ) : null}
            <label htmlFor={emailId} className="sr-only">
              Email for launch notification
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="form-control h-12 w-full rounded-3xl bg-cream-50/90 px-4 text-base"
            />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" fullWidth onClick={onClose}>
                Not now
              </Button>
              <Button type="submit" variant="primary" fullWidth loading={isPending}>
                Notify Me
              </Button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className={cn(
            "absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-green-700/60 transition-colors hover:bg-green-50 hover:text-green-900",
            focusRing,
          )}
        >
          ×
        </button>
      </form>
    </dialog>
  );
}
