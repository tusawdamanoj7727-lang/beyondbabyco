import { buildPageMetadata } from "@/lib/seo/metadata";

const FAQS = [
  {
    question: "Are BeyondBabyCo products safe for newborns?",
    answer:
      "Yes. Our products are formulated for delicate newborn skin with gentle, research-backed ingredients. Pure & Gentle Water Baby Wipes are suitable from day one. Always patch-test new products and consult your paediatrician if your baby has specific skin conditions.",
  },
  {
    question: "What ingredients do you NOT use?",
    answer:
      "We avoid harsh sulphates (SLS/SLES), parabens, phthalates, formaldehyde donors, mineral oil, artificial colours, and alcohol in baby-facing formulas. Every ingredient is chosen for safety and purpose — see individual product pages for full INCI lists.",
  },
  {
    question: "Where are products manufactured?",
    answer:
      "BeyondBabyCo products are proudly Made in India, manufactured in GMP-certified facilities under strict quality controls. Our company is based in Udaipur, Rajasthan.",
  },
  {
    question: "Are products dermatologically tested?",
    answer:
      "Yes. All BeyondBabyCo products undergo dermatological testing for skin compatibility. We test for irritation and sensitivity before any product reaches families.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We offer a 7-day return window for unopened products in original packaging. Opened items cannot be returned for hygiene reasons. See our full Refund & Return Policy for details.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Metro cities: 3–5 business days after dispatch. Other locations: 5–7 business days. Orders are typically dispatched within 1–2 business days of confirmation.",
  },
  {
    question: "Do you offer COD?",
    answer:
      "Yes! Cash on Delivery is available on eligible pin codes across India. A small COD handling fee may apply at checkout.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Once dispatched, you will receive a tracking link via email and SMS from our courier partner (via Shiprocket). You can also view order status in your account under My Orders.",
  },
  {
    question: "Can I use products on sensitive skin?",
    answer:
      "Our formulations are designed for sensitive and delicate baby skin. However, every baby is different — we recommend a patch test on a small area before full use, especially for newborns with known skin sensitivities.",
  },
  {
    question: "How do I contact customer support?",
    answer:
      "Email us at care@beyondbabyco.com or WhatsApp +91 72968 87936. Support hours: Monday–Saturday, 10 AM – 6 PM IST. We aim to respond within one business day.",
  },
] as const;

export const metadata = buildPageMetadata({
  title: "FAQ",
  description: "Frequently asked questions about BeyondBabyCo baby care products, orders, and policies.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#faf5f0] py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-3 text-4xl font-black text-[#2d5a27]">Frequently Asked Questions</h1>
        <p className="mb-10 text-gray-500">Answers to common questions from parents like you</p>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl bg-white p-6 shadow-sm open:shadow-md"
            >
              <summary className="cursor-pointer list-none font-semibold text-gray-900 marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-4">
                  {faq.question}
                  <span className="text-[#2d5a27] transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
