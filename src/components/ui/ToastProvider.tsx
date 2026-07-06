"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

type ToastVariant = "success" | "error" | "info" | "warning";

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const noop = () => {};

function createToastApi(): ToastContextValue {
  return {
    toast: (message, variant = "info") => {
      switch (variant) {
        case "success":
          sonnerToast.success(message);
          break;
        case "error":
          sonnerToast.error(message);
          break;
        case "warning":
          sonnerToast.warning(message);
          break;
        default:
          sonnerToast.info(message);
      }
    },
    success: (message) => sonnerToast.success(message),
    error: (message) => sonnerToast.error(message),
    info: (message) => sonnerToast.info(message),
    warning: (message) => sonnerToast.warning(message),
  };
}

/** Wraps children; renders via global `<AppToaster />` in root layout. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => createToastApi(), []);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: noop,
      success: noop,
      error: noop,
      info: noop,
      warning: noop,
    };
  }
  return ctx;
}
