"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, X } from "lucide-react";

import Button from "@/components/ui/Button";
import { handleFocusTrap, lockBodyScroll } from "@/lib/a11y/dialog-a11y";
import { NOTIFY_ME_MESSAGES } from "@/lib/notify-me/messages";
import type { NotifyMeMode } from "@/lib/notify-me/target";
import { cn } from "@/lib/utils";
import { focusRing, surfaceGlassStrong } from "@/lib/design/ui";

type NotifyMeModalProps = {
  open: boolean;
  productCategory: string;
  productId?: string;
  productName?: string;
  mode?: NotifyMeMode;
  onClose: () => void;
};

type FormStatus = "idle" | "loading" | "success" | "error";

function isValidEmail(value: string): boolean {
  return value.trim().includes("@");
}

export default function NotifyMeModal({
  open,
  productCategory,
  productId,
  productName,
  mode = "launch",
  onClose,
}: NotifyMeModalProps) {
  const emailId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");

  const isRestock = mode === "restock";
  const title = isRestock
    ? NOTIFY_ME_MESSAGES.restockTitle(productName ?? productCategory)
    : NOTIFY_ME_MESSAGES.launchTitle(productCategory);
  const subtitle = isRestock ? NOTIFY_ME_MESSAGES.restockSubtitle : NOTIFY_ME_MESSAGES.earlyBird;

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setError(null);
    setSuccessMessage(null);
    setStatus("idle");
  }, [open, productCategory, productId, mode]);

  useEffect(() => {
    if (status !== "success") return;
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [status, onClose]);

  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const focusTarget = emailRef.current ?? dialogRef.current?.querySelector<HTMLElement>("button");
    const focusTimer = window.setTimeout(() => focusTarget?.focus(), 0);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (dialogRef.current) handleFocusTrap(dialogRef.current, e);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open && status !== "success") return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError(NOTIFY_ME_MESSAGES.invalid);
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/notify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          productCategory,
          productId,
          productName,
          mode,
          source: "website",
        }),
      });

      const body = (await response.json()) as {
        ok?: boolean;
        data?: { message?: string };
        error?: string;
      };

      if (!body.ok) {
        setError(body.error ?? NOTIFY_ME_MESSAGES.error);
        setStatus("error");
        return;
      }

      setSuccessMessage(
        body.data?.message ??
          (isRestock
            ? NOTIFY_ME_MESSAGES.restockSuccess(productName ?? productCategory)
            : NOTIFY_ME_MESSAGES.success(productCategory)),
      );
      setStatus("success");
    } catch {
      setError(NOTIFY_ME_MESSAGES.error);
      setStatus("error");
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[120] flex items-center justify-center p-4",
        !open && status === "success" ? "pointer-events-none" : "",
      )}
      role="presentation"
    >
      {open ? (
        <button
          type="button"
          aria-label="Close dialog"
          className="absolute inset-0 bg-green-950/40 backdrop-blur-sm"
          onClick={onClose}
        />
      ) : null}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notify-me-title"
        aria-describedby={status !== "success" ? "notify-me-subtitle" : undefined}
        className={cn(
          surfaceGlassStrong,
          "relative w-[min(92vw,26rem)] rounded-4xl border border-white/80 p-6 shadow-clay",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={cn(
            "absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-green-700/60 transition-colors hover:bg-green-50 hover:text-green-900",
            focusRing,
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {status === "success" && successMessage ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="animate-modal-scale-in grid h-16 w-16 place-items-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <p role="status" className="mt-5 text-base font-semibold leading-relaxed text-green-900">
              {successMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
              {isRestock ? "Back in stock alerts" : "Early access"}
            </p>
            <h2 id="notify-me-title" className="mt-2 pr-8 font-heading text-xl font-bold leading-snug text-green-900">
              {title}
            </h2>
            <p id="notify-me-subtitle" className="mt-2 text-sm leading-relaxed text-green-700/85">
              {subtitle}
            </p>

            {error ? (
              <p role="alert" className="mt-4 rounded-2xl border border-terra-200 bg-terra-50 px-3 py-2 text-xs font-medium text-terra-700">
                {error}
              </p>
            ) : null}

            <div className="mt-5 space-y-3">
              <label htmlFor={emailId} className="sr-only">
                Email address
              </label>
              <input
                ref={emailRef}
                id={emailId}
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={status === "loading"}
                className="form-control h-12 w-full rounded-3xl bg-cream-50/90 px-4 text-base"
              />
              <Button type="submit" variant="primary" fullWidth loading={status === "loading"}>
                Notify Me
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
