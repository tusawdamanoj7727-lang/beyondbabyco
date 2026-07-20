import type { ReactNode } from "react";

type LegalPageShellProps = {
  title: string;
  children: ReactNode;
};

export default function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className="storefront-page-shell min-h-screen bg-brand-cream py-8 md:py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="storefront-page-title mb-3 font-heading text-3xl font-black text-brand-forest md:text-4xl">
          {title}
        </h1>
        <p className="mb-6 text-caption text-green-700 md:mb-10">Last updated: July 2026</p>
        <div className="prose prose-green max-w-none rounded-[var(--radius-card)] bg-white p-5 shadow-sm prose-headings:text-brand-forest prose-a:text-brand-forest md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
