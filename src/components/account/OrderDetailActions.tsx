"use client";

import Link from "next/link";

import Button from "@/components/ui/Button";
import type { OrderStatusTimelineStep } from "@/lib/orders/status-timeline";
import { cn } from "@/lib/utils";

const CANCELLABLE = new Set(["pending", "draft"]);

export default function OrderDetailActions({ orderId, status }: { orderId: string; status: string }) {
  const canCancel = CANCELLABLE.has(status);
  const supportHref = `/account/support?order=${encodeURIComponent(orderId)}`;

  return (
    <div className="flex flex-wrap gap-3">
      {canCancel ? (
        <Button asChild variant="secondary" size="sm">
          <Link href={`${supportHref}&subject=${encodeURIComponent("Cancel order request")}`}>
            Request cancellation
          </Link>
        </Button>
      ) : null}
      <Button asChild variant="secondary" size="sm">
        <Link href={`${supportHref}&subject=${encodeURIComponent("Return request")}`}>Request return</Link>
      </Button>
      <Link
        href={supportHref}
        className="inline-flex min-h-[44px] items-center rounded-full border border-green-200 px-4 text-sm font-semibold text-green-800 hover:bg-green-50"
      >
        Get help
      </Link>
    </div>
  );
}

const STATE_DOT: Record<OrderStatusTimelineStep["state"], string> = {
  complete: "bg-green-600",
  current: "bg-terra-500 ring-4 ring-terra-100",
  upcoming: "bg-green-200",
  terminal: "bg-terra-600",
};

export function OrderStatusTimeline({ steps }: { steps: OrderStatusTimelineStep[] }) {
  return (
    <section className="rounded-3xl border border-cream-200 bg-white p-5" aria-label="Order timeline">
      <h2 className="font-heading text-lg font-bold text-green-900">Order timeline</h2>
      <ol className="mt-4 space-y-4">
        {steps.map((step) => (
          <li key={step.key} className="flex gap-3">
            <span
              className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", STATE_DOT[step.state])}
              aria-hidden
            />
            <div>
              <p className="text-sm font-semibold text-green-900">
                {step.label}
                {step.state === "current" ? (
                  <span className="ml-2 text-xs font-medium text-terra-700">Current</span>
                ) : null}
              </p>
              {step.at ? (
                <p className="text-xs text-green-600/70">
                  {new Date(step.at).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PaymentStatusBadge({ label }: { label: string }) {
  const tone =
    label === "Paid" || label === "COD"
      ? "bg-green-100 text-green-900"
      : label === "Failed"
        ? "bg-terra-100 text-terra-800"
        : label === "Refunded"
          ? "bg-cream-200 text-green-800"
          : "bg-cream-100 text-green-800";

  return (
    <span
      className={cn(
        "inline-flex min-h-[28px] items-center rounded-full px-3 text-xs font-semibold",
        tone,
      )}
    >
      Payment: {label}
    </span>
  );
}
