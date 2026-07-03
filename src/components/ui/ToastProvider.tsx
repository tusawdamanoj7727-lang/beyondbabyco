"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

import { buttonTransition } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { focusRing } from "@/lib/design/ui";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-green-200 bg-green-50 text-green-900",
  error: "border-terra-200 bg-terra-50 text-terra-900",
  info: "border-cream-300 bg-white text-green-900",
};

const VARIANT_ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
      window.setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast,
      success: (message: string) => toast(message, "success"),
      error: (message: string) => toast(message, "error"),
      info: (message: string) => toast(message, "info"),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed bottom-4 left-1/2 z-[200] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:left-auto sm:right-4 sm:translate-x-0"
      >
        {toasts.map((item) => {
          const Icon = VARIANT_ICONS[item.variant];
          return (
            <motion.div
              key={item.id}
              role="status"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={buttonTransition}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm",
                VARIANT_STYLES[item.variant],
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-sm font-medium">{item.message}</p>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(item.id)}
                className={cn("rounded-full p-1 opacity-70 transition-opacity duration-[var(--duration-button)] hover:opacity-100", focusRing)}
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}
