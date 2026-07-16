"use client";

import { useId, useState, useTransition } from "react";
import { Loader2, MapPin } from "lucide-react";

import { checkDeliveryEstimateAction } from "@/lib/storefront/delivery-actions";
import { focusRing, formControl } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function PdpDeliveryEstimator() {
  const inputId = useId();
  const [pin, setPin] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    serviceable?: boolean;
  } | null>(null);

  function check() {
    const cleaned = pin.replace(/\D/g, "").slice(0, 6);
    if (cleaned.length !== 6) {
      setResult({ ok: false, message: "Enter a valid 6-digit PIN code." });
      return;
    }
    startTransition(async () => {
      const res = await checkDeliveryEstimateAction(cleaned);
      if (!res.ok) {
        setResult({ ok: false, message: res.error ?? "Could not check delivery." });
        return;
      }
      if (!res.serviceable) {
        setResult({
          ok: false,
          serviceable: false,
          message: `Not serviceable to ${cleaned} yet.`,
        });
        return;
      }
      const cod = res.cod ? " · COD available" : "";
      setResult({
        ok: true,
        serviceable: true,
        message: `Delivers to ${cleaned} · Est. ${res.estimatedDelivery ?? "3–5 business days"}${cod}`,
      });
    });
  }

  return (
    <div className="rounded-2xl border border-green-100/80 bg-green-50/50 p-3.5">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-green-900">
        <MapPin className="h-4 w-4 text-terra-600" aria-hidden="true" />
        Check delivery
      </p>
      <div className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          PIN code
        </label>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          enterKeyHint="go"
          placeholder="Enter PIN"
          value={pin}
          disabled={pending}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
            setResult(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              check();
            }
          }}
          className={cn(formControl, "flex-1")}
        />
        <button
          type="button"
          onClick={check}
          disabled={pending || pin.length !== 6}
          aria-busy={pending}
          className={cn(
            "min-h-12 shrink-0 rounded-xl bg-brand-forest px-3.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:opacity-60",
            focusRing,
          )}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Check"}
        </button>
      </div>
      {result ? (
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            result.ok ? "text-green-700" : "text-terra-700",
          )}
          role="status"
        >
          {result.message}
        </p>
      ) : (
        <p className="mt-2 text-xs text-green-700">See if we deliver to your area before you buy.</p>
      )}
    </div>
  );
}
