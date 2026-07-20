export type HelpCategoryId =
  | "ordering"
  | "payments"
  | "shipping"
  | "delivery"
  | "returns"
  | "refunds"
  | "tracking"
  | "product-care"
  | "contact";

export type HelpFaqItem = {
  question: string;
  answer: string;
  category: HelpCategoryId;
};

export const HELP_CATEGORIES: {
  id: HelpCategoryId;
  title: string;
  description: string;
  href?: string;
}[] = [
  { id: "ordering", title: "Ordering", description: "Placing orders, guest checkout, and changes." },
  { id: "payments", title: "Payments", description: "Razorpay, COD, and payment confirmations." },
  { id: "shipping", title: "Shipping", description: "Dispatch times and shipping policy.", href: "/shipping-policy" },
  { id: "delivery", title: "Delivery", description: "Timelines by location and what to expect." },
  { id: "returns", title: "Returns", description: "Eligibility and how to start a return.", href: "/refund-policy" },
  { id: "refunds", title: "Refunds", description: "Timelines after a return is approved.", href: "/refund-policy" },
  { id: "tracking", title: "Tracking", description: "AWB numbers and order status.", href: "/track-order" },
  { id: "product-care", title: "Product care", description: "Usage, storage, and skin tips.", href: "/learn" },
  { id: "contact", title: "Contact options", description: "Email, WhatsApp, and response times.", href: "/contact" },
];

/** Categorised help FAQs — powers /help and can feed /faq. */
export const HELP_FAQ_ITEMS: HelpFaqItem[] = [
  {
    category: "ordering",
    question: "Do I need an account to place an order?",
    answer:
      "No. Guest checkout is supported. You can create an account later to track orders and save addresses.",
  },
  {
    category: "ordering",
    question: "Can I change or cancel an order after placing it?",
    answer:
      "Contact us quickly with your order number. Once an order is packed or shipped, changes may not be possible — we will confirm what options remain.",
  },
  {
    category: "payments",
    question: "What payment methods do you accept?",
    answer:
      "Prepaid payments are processed securely via Razorpay. Cash on Delivery (COD) is available on eligible pin codes; a small COD fee may apply at checkout.",
  },
  {
    category: "payments",
    question: "My payment failed but money was deducted. What now?",
    answer:
      "Failed gateway attempts are usually auto-reversed by your bank. Share your order number and payment reference at info@beyondbabyco.com so we can help verify status.",
  },
  {
    category: "shipping",
    question: "When will my order ship?",
    answer:
      "Orders are typically dispatched within 1–2 business days after confirmation. See our Shipping Policy for free-shipping thresholds and timelines.",
  },
  {
    category: "delivery",
    question: "How long does delivery take?",
    answer:
      "Metro cities: usually 3–5 business days after dispatch. Other locations: often 5–7 business days. Exact ETAs depend on courier and pin code.",
  },
  {
    category: "returns",
    question: "What is your return policy?",
    answer:
      "We offer a return window for unopened products in original packaging. Opened items generally cannot be returned for hygiene reasons. Full details are on the Refund & Return Policy page.",
  },
  {
    category: "refunds",
    question: "How long do refunds take?",
    answer:
      "After a return is approved and received, refunds are processed according to the payment method. Bank timelines can add a few business days after we initiate the refund.",
  },
  {
    category: "tracking",
    question: "How do I track my order?",
    answer:
      "Use Track Order with your order number and checkout email, or sign in to My Orders. Once shipped, courier AWB details appear when available.",
  },
  {
    category: "product-care",
    question: "Are products safe for newborns?",
    answer:
      "Our formulas are developed for delicate skin and dermatologically tested. Always patch-test and consult your paediatrician for specific conditions. See product pages and our Learn hub for usage guidance.",
  },
  {
    category: "product-care",
    question: "Where can I learn about ingredients?",
    answer:
      "Visit the Ingredient Library for purpose, safety, and baby-safe explanations. Product pages also list INCI details where available.",
  },
  {
    category: "contact",
    question: "How do I contact customer support?",
    answer:
      "Email info@beyondbabyco.com, WhatsApp +91 72968 87936, or use the Contact form. Support hours: Monday–Saturday, 10 AM – 6 PM IST. We aim to reply within one business day.",
  },
];

/** Flat list for FAQ JSON-LD and the classic /faq page. */
export const STOREFRONT_FAQ_ITEMS = HELP_FAQ_ITEMS.map(({ question, answer }) => ({
  question,
  answer,
}));
