"use client";

type ActionResult = {
  ok?: boolean;
  error?: string | null;
  content?: string | null;
};

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

/** Map server action responses to admin toasts (replaces alert()). */
export function notifyActionResult(
  toast: ToastApi,
  res: ActionResult,
  successMessage = "Saved successfully",
) {
  if (!res.ok && res.error) {
    toast.error(res.error);
    return;
  }
  if (res.content) {
    toast.info(res.content);
    return;
  }
  if (res.ok) {
    toast.success(successMessage);
  }
}
