export type FaqItem = {
  question: string;
  answer: string;
};

/** Shared FAQ copy for the dedicated /faq page and FAQ JSON-LD. */
export const STOREFRONT_FAQ_ITEMS: FaqItem[] = [
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
];
