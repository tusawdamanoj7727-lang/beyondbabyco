"use client";

import NotifyMeButton from "@/components/homepage/NotifyMeButton";

export default function ProductsComingSoonSection() {
  return (
    <section className="bg-[#1a3a16] px-4 py-12">
      <div className="mx-auto max-w-6xl text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-green-400">Coming Soon</p>
        <h2 className="mb-3 text-3xl font-bold text-white">Beyond Baby Care</h2>
        <p className="mx-auto mb-8 max-w-lg text-sm text-green-200">
          After our baby range, we&apos;re bringing the same research-backed formulas to men and women.
        </p>
        <div className="mx-auto grid max-w-xl gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white/10 p-5 text-left">
            <h3 className="text-lg font-bold text-white">Men Care Range</h3>
            <p className="mt-1 text-sm text-green-300">Launching 2027</p>
            <NotifyMeButton
              productCategory="Men Care Range"
              label="Notify Me"
              className="mt-4 rounded-xl border border-white/30 bg-transparent text-white hover:bg-white/10"
            />
          </div>
          <div className="rounded-2xl bg-white/10 p-5 text-left">
            <h3 className="text-lg font-bold text-white">Women Care Range</h3>
            <p className="mt-1 text-sm text-green-300">Launching 2027</p>
            <NotifyMeButton
              productCategory="Women Care Range"
              label="Notify Me"
              className="mt-4 rounded-xl border border-white/30 bg-transparent text-white hover:bg-white/10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
