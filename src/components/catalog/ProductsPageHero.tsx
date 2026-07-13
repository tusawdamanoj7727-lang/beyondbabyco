import HomepageMascotGuide from "@/components/mascots/HomepageMascotGuide";
import { PRODUCTS_PAGE } from "@/lib/brand/copy";

export default function ProductsPageHero() {
  return (
    <section className="relative overflow-visible bg-brand-cream py-16 text-center">
      <HomepageMascotGuide
        mascot="bella-bunny"
        pose="hold-product"
        size={180}
        placementClassName="right-4 bottom-0 xl:right-8"
      />
      <div className="relative z-10 mx-auto max-w-3xl px-4">
        <span className="text-eyebrow font-bold uppercase tracking-widest text-brand-terra">
          {PRODUCTS_PAGE.heroEyebrow}
        </span>
        <h1 className="mb-4 mt-3 font-heading text-4xl font-black text-brand-forest sm:text-5xl">
          {PRODUCTS_PAGE.heroTitle}
        </h1>
        <p className="mx-auto max-w-xl text-body text-green-700/80 sm:text-lg">
          {PRODUCTS_PAGE.heroDescription}
        </p>
      </div>
    </section>
  );
}
