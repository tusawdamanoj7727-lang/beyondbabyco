import type { ReactNode } from "react";

type LegalPageShellProps = {
  title: string;
  children: ReactNode;
};

export default function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-brand-cream py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-3 font-heading text-4xl font-black text-brand-forest">{title}</h1>
        <p className="mb-10 text-caption text-green-700/70">Last updated: July 2026</p>
        <div className="prose prose-green max-w-none rounded-[var(--radius-card)] bg-white p-8 shadow-sm prose-headings:text-brand-forest prose-a:text-brand-forest">
          {children}
        </div>
      </div>
    </div>
  );
}
