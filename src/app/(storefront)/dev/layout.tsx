import { notFound } from "next/navigation";

import { isAiDevEnabled } from "@/lib/ai/generateImage";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (!isAiDevEnabled()) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-cream-50 pt-24">
      <div className="border-b border-green-100 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900">
        Developer tools — not available in production
      </div>
      {children}
    </div>
  );
}
