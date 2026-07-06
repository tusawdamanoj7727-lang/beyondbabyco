import HomepageMascotGuide from "@/components/mascots/HomepageMascotGuide";
import { PRODUCTS_PAGE } from "@/lib/brand/copy";

export default function ProductsPageHero() {
  return (
    <section className="relative overflow-visible bg-[#faf5f0] py-16 text-center">
      <HomepageMascotGuide
        mascot="bella-bunny"
        pose="hold-product"
        size={180}
        placementClassName="right-4 bottom-0 xl:right-8"
      />
      <div className="relative z-10 mx-auto max-w-3xl px-4">
        <span className="text-sm font-bold uppercase tracking-widest text-[#c4673a]">
          {PRODUCTS_PAGE.heroEyebrow}
        </span>
        <h1 className="mb-4 mt-3 text-4xl font-black text-[#2d5a27] sm:text-5xl font-[family-name:var(--font-montserrat)]">
          {PRODUCTS_PAGE.heroTitle}
        </h1>
        <p className="mx-auto max-w-xl text-lg text-gray-600 sm:text-xl">
          {PRODUCTS_PAGE.heroDescription}
        </p>
      </div>
    </section>
  );
}
