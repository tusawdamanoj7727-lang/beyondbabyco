import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export const fieldControlClasses =
  "w-full rounded-2xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-sm text-green-900 placeholder:text-green-700/40 transition-all duration-[var(--duration-fast)] focus:border-green-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 disabled:opacity-60 aria-[invalid=true]:border-terra-400 aria-[invalid=true]:ring-terra-400/40";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  description?: string;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function FormField({
  label,
  htmlFor,
  error,
  description,
  required,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-green-900">
          {label}
          {required && <span className="ml-0.5 text-terra-500" aria-hidden="true">*</span>}
        </label>
        {hint}
      </div>
      {description && <p className="text-xs text-green-700/60">{description}</p>}
      {children}
      {error && (
        <p className="text-xs font-medium text-terra-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(fieldControlClasses, className)} {...rest} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...rest }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(fieldControlClasses, "resize-y", className)} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn(fieldControlClasses, "appearance-none pr-9", className)} {...rest}>
        {children}
      </select>
    );
  },
);

export function Checkbox({
  label,
  description,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  const id = useId();
  return (
    <label
      htmlFor={rest.id ?? id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border border-cream-300 bg-cream-50 p-3.5 transition-colors hover:border-green-300",
        className,
      )}
    >
      <input
        id={rest.id ?? id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-cream-300 accent-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
        {...rest}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-green-900">{label}</span>
        {description && <span className="block text-xs text-green-700/60">{description}</span>}
      </span>
    </label>
  );
}
