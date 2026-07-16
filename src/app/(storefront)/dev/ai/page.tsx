import dynamic from "next/dynamic";

import ModuleLoading from "@/components/ui/ModuleLoading";

const AiDevClient = dynamic(() => import("./AiDevClient"), {
  loading: () => <ModuleLoading label="Loading AI tools…" />,
});

export const metadata = {
  title: "AI Image Generator — Dev",
  robots: { index: false, follow: false },
};

export default function AiDevPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Developer utility</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-green-900">Local AI Image Generator</h1>
        <p className="mt-2 max-w-2xl text-green-700">
          Generate images with FLUX.1 Schnell via ComfyUI. Outputs save to{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-sm">public/images/generated/</code>.
        </p>
      </header>
      <AiDevClient />
    </div>
  );
}
