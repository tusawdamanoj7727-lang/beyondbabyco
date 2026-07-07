import type { ReactNode } from "react";

type LegalPageShellProps = {
  title: string;
  children: ReactNode;
};

export default function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-[#faf5f0] py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-3 text-4xl font-black text-[#2d5a27]">{title}</h1>
        <p className="mb-10 text-gray-500">Last updated: July 2026</p>
        <div className="prose prose-green max-w-none rounded-2xl bg-white p-8 shadow-sm prose-headings:text-[#2d5a27] prose-a:text-[#2d5a27]">
          {children}
        </div>
      </div>
    </div>
  );
}
