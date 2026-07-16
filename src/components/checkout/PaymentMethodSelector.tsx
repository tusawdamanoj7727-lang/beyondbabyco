"use client";

import { Banknote, CreditCard, Smartphone, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { focusRing, pressableSurface } from "@/lib/design/ui";

export type PaymentMethodId = "razorpay" | "cod";

const METHODS: {
  id: PaymentMethodId;
  label: string;
  description: string;
  icon: typeof CreditCard;
}[] = [
  {
    id: "razorpay",
    label: "Pay Online",
    description: "UPI, cards, net banking & wallets via Razorpay",
    icon: CreditCard,
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay when your order arrives at your doorstep",
    icon: Banknote,
  },
];

export default function PaymentMethodSelector({
  value,
  onChange,
  razorpayAvailable,
  codAvailable,
  disabled,
}: {
  value: PaymentMethodId;
  onChange: (id: PaymentMethodId) => void;
  razorpayAvailable: boolean;
  codAvailable: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
      {METHODS.map((method) => {
        const available = method.id === "cod" ? codAvailable : razorpayAvailable;
        const Icon = method.icon;
        const selected = value === method.id;

        return (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled || !available}
            onClick={() => onChange(method.id)}
            className={cn(
              pressableSurface,
              "flex flex-col items-start rounded-2xl border p-4 text-left",
              focusRing,
              selected
                ? "border-green-500 bg-green-50/80 shadow-sm"
                : "border-green-100 bg-white/90 hover:border-green-200",
              !available && "cursor-not-allowed opacity-50",
            )}
          >
            <div className="flex w-full items-center gap-3">
              <span
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-xl",
                  selected ? "bg-green-500 text-white" : "bg-cream-100 text-green-800",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-semibold text-green-900">{method.label}</p>
                <p className="text-xs text-green-700">{method.description}</p>
              </div>
            </div>
            {method.id === "razorpay" ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <MethodBadge icon={Smartphone} label="UPI" />
                <MethodBadge icon={CreditCard} label="Cards" />
                <MethodBadge icon={Banknote} label="Net Banking" />
                <MethodBadge icon={Wallet} label="Wallets" />
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function MethodBadge({ icon: Icon, label }: { icon: typeof CreditCard; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}
