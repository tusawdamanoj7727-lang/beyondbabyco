import Link from "next/link";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "About Us",
  description:
    "Founded in 2021 in Udaipur, BeyondBabyCo is built on 5 years of research into safe, gentle baby care.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#faf5f0] py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-3 text-4xl font-black text-[#2d5a27]">About BeyondBabyCo</h1>
        <p className="mb-10 text-gray-500">Every Baby Deserves The Safest Touch</p>

        <div className="prose prose-green max-w-none rounded-2xl bg-white p-8 shadow-sm prose-headings:text-[#2d5a27]">
          <p className="text-lg leading-relaxed text-gray-700">
            Founded in <strong>2021</strong> in <strong>Udaipur, Rajasthan</strong> by{" "}
            <strong>Tusawda Global Private Limited</strong>, BeyondBabyCo was born from a simple belief:
            every baby deserves safe, gentle, scientifically-backed care — with no compromises on ingredients.
          </p>

          <h2>5 years of research &amp; development</h2>
          <p>
            Before our first product reached families, we spent five years researching formulations,
            testing ingredients, and working with dermatologists and paediatric advisors. We did not rush to
            market. We researched until we were confident every product meets the standard we would want for
            our own children.
          </p>

          <h2>Our mission</h2>
          <p>
            <strong>Every baby deserves the safest touch.</strong> We create baby care products that parents
            can trust — transparent ingredients, rigorous testing, and honest communication. No greenwashing.
            No harmful shortcuts.
          </p>

          <h2>What we stand for</h2>
          <ul>
            <li>
              <strong>Research-backed:</strong> Every formula is developed through scientific research, not
              trends.
            </li>
            <li>
              <strong>Dermatologically tested:</strong> Tested for skin compatibility before launch.
            </li>
            <li>
              <strong>Made in India:</strong> Proudly manufactured in GMP-certified Indian facilities.
            </li>
            <li>
              <strong>Ingredient transparency:</strong> Full INCI lists on every product. No hidden chemicals.
            </li>
            <li>
              <strong>No compromises:</strong> We exclude parabens, sulphates, phthalates, and harsh alcohols
              from baby-facing formulas.
            </li>
          </ul>

          <h2>Meet our mascots</h2>
          <p>
            Bella, Gigi, Poppy, Eli, Penny, and Benny represent the values we build into every product — care,
            safety, learning, gentleness, discovery, and joy.
          </p>
          <p>
            <Link href="/mascots" className="font-semibold text-[#2d5a27] no-underline hover:underline">
              Meet the mascot family →
            </Link>
          </p>

          <h2>From Udaipur to families across India</h2>
          <p>
            We are a small, passionate team based in Rajasthan, serving families across India through
            beyondbabyco.in. When you choose BeyondBabyCo, you are supporting Indian research, Indian
            manufacturing, and a brand that puts your baby first.
          </p>
        </div>
      </div>
    </div>
  );
}
