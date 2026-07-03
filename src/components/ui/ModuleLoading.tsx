import Logo from "@/components/brand/Logo";

import { MICROCOPY } from "@/lib/brand/copy";

export default function ModuleLoading({ label = MICROCOPY.loading }: { label?: string }) {
  return (
    <div
      className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-cream-300 bg-cream-50/60 px-6 py-12"
      role="status"
      aria-live="polite"
    >
      <Logo href={null} size="loading" priority />
      <span aria-hidden="true" className="spinner-premium text-green-700" />
      <span className="text-sm font-medium text-green-700/80">{label}</span>
    </div>
  );
}
