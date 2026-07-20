"use client";

import { Loader2 } from "lucide-react";

import { INDIAN_STATES, type AddressFormValues } from "@/lib/checkout/schema";
import { focusRing, formControl } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type FieldErrors = Record<string, string>;

function inputClass(hasError?: boolean) {
  return cn(formControl, focusRing, hasError && "border-terra-400 ring-1 ring-terra-200");
}

export function CheckoutField({
  label,
  id,
  children,
  className,
  error,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-green-800">
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 rounded-lg bg-terra-50 px-2.5 py-1.5 text-xs font-medium text-terra-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CheckoutSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-green-100/80 bg-white/90 p-4 shadow-sm sm:p-5">
      <h2 className="font-heading text-lg font-bold text-green-900">{title}</h2>
      {description ? <p className="mt-1.5 text-sm leading-relaxed text-green-700">{description}</p> : null}
      <div className="mt-4 sm:mt-5">{children}</div>
    </section>
  );
}

export function CheckoutReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white/80 p-3.5 sm:p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-green-600">{title}</p>
      <div className="mt-2 text-green-900">{children}</div>
    </div>
  );
}

export default function CheckoutAddressFields({
  idPrefix,
  values,
  onChange,
  checkingPin,
  errors = {},
}: {
  idPrefix: string;
  values: AddressFormValues;
  onChange: (field: keyof AddressFormValues, value: string) => void;
  checkingPin?: boolean;
  errors?: FieldErrors;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const auto = idPrefix === "billing" ? "billing" : "shipping";
  const err = (field: string) => errors[`${idPrefix}.${field}`];

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <CheckoutField label="Full name" id={id("name")} error={err("full_name")}>
        <input
          id={id("name")}
          name={`${auto} name`}
          value={values.full_name}
          onChange={(e) => onChange("full_name", e.target.value)}
          className={inputClass()}
          autoComplete={`${auto} name`}
          enterKeyHint="next"
          aria-invalid={!!err("full_name")}
          aria-describedby={err("full_name") ? `${id("name")}-error` : undefined}
        />
      </CheckoutField>
      <CheckoutField label="Phone" id={id("phone")} error={err("phone")}>
        <input
          id={id("phone")}
          name={`${auto} tel`}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={values.phone}
          onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
          className={inputClass()}
          autoComplete={`${auto} tel`}
          enterKeyHint="next"
          aria-invalid={!!err("phone")}
          aria-describedby={err("phone") ? `${id("phone")}-error` : undefined}
        />
      </CheckoutField>
      <CheckoutField label="Address line 1" id={id("line1")} className="sm:col-span-2" error={err("line1")}>
        <input
          id={id("line1")}
          value={values.line1}
          onChange={(e) => onChange("line1", e.target.value)}
          className={inputClass()}
          autoComplete={`${auto} address-line1`}
          enterKeyHint="next"
          aria-invalid={!!err("line1")}
          aria-describedby={err("line1") ? `${id("line1")}-error` : undefined}
        />
      </CheckoutField>
      <CheckoutField label="Address line 2 (optional)" id={id("line2")} className="sm:col-span-2">
        <input
          id={id("line2")}
          value={values.line2 ?? ""}
          onChange={(e) => onChange("line2", e.target.value)}
          className={inputClass()}
          autoComplete={`${auto} address-line2`}
          enterKeyHint="next"
        />
      </CheckoutField>
      <CheckoutField label="PIN code" id={id("pin")} error={err("pincode")}>
        <input
          id={id("pin")}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={values.pincode}
          onChange={(e) => onChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
          className={inputClass()}
          autoComplete={`${auto} postal-code`}
          enterKeyHint="next"
          aria-invalid={!!err("pincode")}
          aria-describedby={err("pincode") ? `${id("pin")}-error` : undefined}
        />
        {checkingPin ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Checking PIN…
          </p>
        ) : null}
      </CheckoutField>
      <CheckoutField label="City" id={id("city")} error={err("city")}>
        <input
          id={id("city")}
          value={values.city}
          onChange={(e) => onChange("city", e.target.value)}
          className={inputClass()}
          autoComplete={`${auto} address-level2`}
          enterKeyHint="next"
          aria-invalid={!!err("city")}
          aria-describedby={err("city") ? `${id("city")}-error` : undefined}
        />
      </CheckoutField>
      <CheckoutField label="State" id={id("state")} className="sm:col-span-2" error={err("state")}>
        <select
          id={id("state")}
          value={values.state}
          onChange={(e) => onChange("state", e.target.value)}
          className={inputClass()}
          autoComplete={`${auto} address-level1`}
          aria-invalid={!!err("state")}
          aria-describedby={err("state") ? `${id("state")}-error` : undefined}
        >
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </CheckoutField>
      <input type="hidden" autoComplete={`${auto} country-name`} value="India" readOnly />
    </div>
  );
}
