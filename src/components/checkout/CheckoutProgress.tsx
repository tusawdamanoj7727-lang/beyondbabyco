import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Address" },
  { id: 3, label: "Payment" },
  { id: 4, label: "Review" },
] as const;

/**
 * Visual progress only — does not gate checkout steps.
 * Helps guests understand the flow before placing an order.
 */
export default function CheckoutProgress({
  currentStep = 1,
  className,
}: {
  currentStep?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  return (
    <nav aria-label="Checkout progress" className={cn("mb-8", className)}>
      <ol className="flex items-center justify-between gap-1 sm:gap-2">
        {STEPS.map((step, index) => {
          const done = step.id < currentStep;
          const current = step.id === currentStep;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
              <div className="flex min-w-0 flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    done && "bg-green-700 text-white",
                    current && "bg-terra-500 text-white ring-4 ring-terra-100",
                    !done && !current && "bg-green-100 text-green-600",
                  )}
                  aria-current={current ? "step" : undefined}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : step.id}
                </span>
                <span
                  className={cn(
                    "truncate text-[11px] font-semibold sm:text-xs",
                    current ? "text-green-900" : "text-green-600",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-1 hidden h-0.5 flex-1 rounded-full sm:block",
                    done ? "bg-green-400" : "bg-green-100",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-xs text-green-600 sm:text-left">
        Complete your details, then review before payment. Your cart is saved.
      </p>
    </nav>
  );
}
