"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Download, ExternalLink, Loader2, Package, Printer, Truck } from "lucide-react";

import Button from "@/components/ui/Button";
import { formatInr } from "@/lib/catalog/format";
import { focusRing, formControl, formLabel, premiumPageBg } from "@/lib/design/ui";
import type { GuestTrackResult, GuestTrackTimelineStep } from "@/lib/orders/guest-track-types";
import { ORDER_NUMBER_REGEX } from "@/lib/orders/guest-track-types";
import { cn } from "@/lib/utils";

type FieldErrors = Partial<Record<"orderNumber" | "email", string>>;

function Timeline({ steps }: { steps: GuestTrackTimelineStep[] }) {
  return (
    <ol className="space-y-3" aria-label="Order timeline">
      {steps.map((step) => {
        const done = step.state === "complete" || step.state === "terminal";
        const current = step.state === "current";
        return (
          <li key={step.key} className="flex gap-3">
            <span className="mt-0.5 shrink-0" aria-hidden="true">
              {done ? (
                <CheckCircle2
                  className={cn(
                    "h-5 w-5",
                    step.state === "terminal" ? "text-terra-600" : "text-green-700",
                  )}
                />
              ) : (
                <Circle className={cn("h-5 w-5", current ? "text-terra-500" : "text-green-200")} />
              )}
            </span>
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  done || current ? "text-green-900" : "text-green-500",
                )}
              >
                {step.label}
                {current ? (
                  <span className="ml-2 text-xs font-medium text-terra-600">Current</span>
                ) : null}
              </p>
              {step.at ? (
                <p className="text-xs text-green-600">
                  {new Intl.DateTimeFormat("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(step.at))}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function OrderResult({ order }: { order: GuestTrackResult }) {
  return (
    <section
      className="mt-8 space-y-6 rounded-3xl border border-green-100 bg-white/95 p-5 shadow-card sm:p-8"
      aria-live="polite"
      aria-label={`Order ${order.orderNumber} details`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Order number</p>
          <h2 className="font-heading text-2xl font-bold text-green-900">{order.orderNumber}</h2>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            order.isCancelled || order.isRefunded
              ? "bg-terra-100 text-terra-800"
              : "bg-green-100 text-green-800",
          )}
        >
          {order.statusLabel}
        </span>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-green-600">Order date</dt>
          <dd className="font-medium text-green-900">{order.orderDate}</dd>
        </div>
        <div>
          <dt className="text-green-600">Estimated delivery</dt>
          <dd className="font-medium text-green-900">{order.estimatedDelivery ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-green-600">Payment method</dt>
          <dd className="font-medium text-green-900">{order.paymentMethod ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-green-600">Grand total</dt>
          <dd className="font-heading text-lg font-bold text-green-900">
            {formatInr(order.grandTotal)}
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="mb-3 flex items-center gap-2 font-heading text-base font-bold text-green-900">
          <Package className="h-4 w-4" aria-hidden="true" />
          Items ordered
        </h3>
        <ul className="divide-y divide-green-50 rounded-2xl border border-green-100">
          {order.items.map((item, idx) => (
            <li key={`${item.name}-${idx}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-green-900">{item.name}</p>
                <p className="text-green-600">Qty {item.quantity}</p>
              </div>
              <p className="font-semibold text-green-900">{formatInr(item.lineTotal)}</p>
            </li>
          ))}
        </ul>
      </div>

      {order.shippingAddress ? (
        <div>
          <h3 className="mb-2 font-heading text-base font-bold text-green-900">Shipping address</h3>
          <p className="text-sm text-green-800">
            {order.shippingAddress.nameMasked}
            <br />
            {order.shippingAddress.line1Masked}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state} —{" "}
            {order.shippingAddress.pincode}
          </p>
          <p className="mt-1 text-xs text-green-500">Address partially masked for your privacy.</p>
        </div>
      ) : null}

      {(order.trackingNumber || order.courierName) && (
        <div className="rounded-2xl border border-green-100 bg-cream-50/80 p-4">
          <h3 className="mb-2 flex items-center gap-2 font-heading text-base font-bold text-green-900">
            <Truck className="h-4 w-4" aria-hidden="true" />
            Shipment
          </h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {order.courierName ? (
              <div>
                <dt className="text-green-600">Courier</dt>
                <dd className="font-medium text-green-900">{order.courierName}</dd>
              </div>
            ) : null}
            {order.trackingNumber ? (
              <div>
                <dt className="text-green-600">Tracking number (AWB)</dt>
                <dd className="font-mono text-sm font-semibold text-green-900">
                  {order.trackingNumber}
                </dd>
              </div>
            ) : null}
            {order.shipmentStatus ? (
              <div>
                <dt className="text-green-600">Shipment status</dt>
                <dd className="font-medium capitalize text-green-900">
                  {order.shipmentStatus.replace(/_/g, " ")}
                </dd>
              </div>
            ) : null}
            {order.latestShipmentUpdate ? (
              <div className="sm:col-span-2">
                <dt className="text-green-600">Latest update</dt>
                <dd className="font-medium text-green-900">{order.latestShipmentUpdate}</dd>
              </div>
            ) : null}
          </dl>
          {order.trackingUrl ? (
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                  Track with courier
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <div>
        <h3 className="mb-3 font-heading text-base font-bold text-green-900">Timeline</h3>
        <Timeline steps={order.timeline} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="primary">
          <a href={order.invoiceDownloadUrl}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Download Invoice
          </a>
        </Button>
        <Button asChild variant="secondary">
          <a href={order.invoicePrintUrl} target="_blank" rel="noopener noreferrer">
            <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
            Print Invoice
          </a>
        </Button>
      </div>
    </section>
  );
}

export default function TrackOrderClient({
  initialOrderNumber = "",
}: {
  initialOrderNumber?: string;
}) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<GuestTrackResult | null>(null);

  const canSubmit = useMemo(() => !loading, [loading]);

  function validateLocal(): FieldErrors {
    const errors: FieldErrors = {};
    const on = orderNumber.trim().toUpperCase().replace(/\s+/g, "");
    const em = email.trim().toLowerCase();
    if (!on) errors.orderNumber = "Enter your order number.";
    else if (!ORDER_NUMBER_REGEX.test(on)) {
      errors.orderNumber = "Order number should look like ORD-20260718-XXXXX.";
    }
    if (!em) errors.email = "Enter the email used at checkout.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      errors.email = "Enter a valid email address.";
    }
    return errors;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setOrder(null);
    const local = validateLocal();
    setFieldErrors(local);
    if (Object.keys(local).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        fieldErrors?: FieldErrors;
        order?: GuestTrackResult;
        ok?: boolean;
      };

      if (res.status === 400 && data.fieldErrors) {
        setFieldErrors(data.fieldErrors);
        setFormError(data.error ?? "Please fix the highlighted fields.");
        return;
      }
      if (res.status === 429) {
        setFormError("Too many attempts. Please wait a minute and try again.");
        return;
      }
      if (!res.ok || !data.order) {
        setFormError(
          data.error ??
            "We could not find an order matching those details. Check your order number and email, then try again.",
        );
        return;
      }
      setOrder(data.order);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn(premiumPageBg, "pb-16")}>
      <div className="container mx-auto max-w-2xl px-4 pt-8 sm:pt-12">
        <p className="text-eyebrow text-terra-600">Guest order tracking</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-green-900 sm:text-4xl">
          Track your order
        </h1>
        <p className="mt-3 text-sm text-green-700 sm:text-base">
          Enter the order number from your confirmation email and the email address used at
          checkout. No account required.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-3xl border border-green-100 bg-white/95 p-5 shadow-card sm:p-8"
          noValidate
          aria-describedby={formError ? "track-form-error" : undefined}
        >
          <div>
            <label htmlFor="track-order-number" className={formLabel}>
              Order number
            </label>
            <input
              id="track-order-number"
              name="orderNumber"
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
              placeholder="ORD-20260718-XXXXX"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              aria-invalid={Boolean(fieldErrors.orderNumber)}
              aria-describedby={fieldErrors.orderNumber ? "track-order-number-error" : undefined}
              className={cn(formControl, "mt-1.5", focusRing)}
            />
            {fieldErrors.orderNumber ? (
              <p id="track-order-number-error" className="mt-1.5 text-sm text-terra-700" role="alert">
                {fieldErrors.orderNumber}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="track-email" className={formLabel}>
              Email address
            </label>
            <input
              id="track-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "track-email-error" : undefined}
              className={cn(formControl, "mt-1.5", focusRing)}
            />
            {fieldErrors.email ? (
              <p id="track-email-error" className="mt-1.5 text-sm text-terra-700" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p id="track-form-error" className="rounded-xl bg-terra-50 px-3 py-2 text-sm text-terra-800" role="alert">
              {formError}
            </p>
          ) : null}

          <Button type="submit" variant="primary" fullWidth disabled={!canSubmit} aria-busy={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Looking up…
              </>
            ) : (
              "Track Order"
            )}
          </Button>

          <p className="text-center text-xs text-green-600">
            Have an account?{" "}
            <Link href="/login?redirectTo=/account/orders" className="font-semibold text-green-800 underline-offset-2 hover:underline">
              Sign in to view all orders
            </Link>
          </p>
        </form>

        {order ? <OrderResult order={order} /> : null}
      </div>
    </div>
  );
}
