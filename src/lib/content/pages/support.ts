import { brandSupportEmail } from "@/lib/brand/contact";
import { CONTENT_IMAGES } from "@/lib/content/images";
import type { ContentPage } from "@/lib/content/types";

export const contactPage: ContentPage = {
  slug: "contact",
  title: "Contact Us",
  description:
    "Get in touch with BeyondBabyCo — customer support, product enquiries, and partnership requests. Based in Udaipur, Rajasthan, India.",
  eyebrow: "We're Here to Help",
  heroImage: CONTENT_IMAGES.contact,
  relatedLinks: [
    { label: "FAQ", href: "/faq" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Return Policy", href: "/return-policy" },
  ],
  sections: [
    {
      type: "intro",
      paragraphs: [
        "Whether you have a question about an order, want to learn more about our products, or are interested in partnering with us — we would love to hear from you.",
        `Email us directly at ${brandSupportEmail()} or use the form below. Our support team is available Monday through Saturday, 10 AM – 6 PM IST.`,
      ],
    },
    {
      type: "cards",
      title: "How to reach us",
      columns: 3,
      items: [
        {
          icon: "heart",
          title: "Customer Support",
          description: `Order help, returns, and product questions.\nEmail: ${brandSupportEmail()}`,
        },
        {
          icon: "beaker",
          title: "Product Enquiries",
          description: "Ingredients, safety, and formulation questions. We respond within one business day.",
        },
        {
          icon: "sparkles",
          title: "Partnerships & Press",
          description: "Retail, distribution, and media enquiries. Subject: Partnership or Press Enquiry.",
        },
      ],
    },
    {
      type: "cards",
      title: "Visit us",
      columns: 2,
      items: [
        {
          title: "BeyondBabyCo",
          description: "Tusawda Global Private Limited\nUdaipur, Rajasthan, India",
        },
        {
          title: "Support Hours",
          description: "Monday – Saturday\n10:00 AM – 6:00 PM IST",
        },
      ],
    },
    {
      type: "contact",
    },
    {
      type: "cta",
      title: "Looking for quick answers?",
      description: "Browse our frequently asked questions.",
      primary: { label: "View FAQ", href: "/faq" },
      secondary: { label: "Shop Products", href: "/products" },
    },
  ],
};

export const faqPage: ContentPage = {
  slug: "faq",
  title: "FAQ",
  description:
    "Frequently asked questions about BeyondBabyCo products, orders, shipping, returns, and baby care ingredients.",
  eyebrow: "Help Centre",
  jsonLd: "faq",
  relatedLinks: [
    { label: "Contact", href: "/contact" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Return Policy", href: "/return-policy" },
    { label: "Ingredients", href: "/ingredients" },
  ],
  sections: [
    {
      type: "intro",
      paragraphs: [
        "Find answers to common questions about our products, ordering, and policies. Can't find what you need? Contact us and we will respond within one business day.",
      ],
    },
    {
      type: "faq",
      title: "Common questions",
      items: [
        {
          question: "What is BeyondBabyCo?",
          answer:
            "BeyondBabyCo is a research-led baby care brand from Udaipur, Rajasthan, operated by Tusawda Global Private Limited. We create gentle, dermatologically tested wipes, wash, and skin care for Indian families.",
          category: "General",
        },
        {
          question: "Are BeyondBabyCo products safe for newborns?",
          answer:
            "Yes. Our products are formulated with newborn skin in mind and undergo dermatological testing. Check individual product labels for age guidance and patch test if your baby has known sensitivities.",
          category: "Products",
        },
        {
          question: "Are your products paraben and sulfate free?",
          answer:
            "Yes. BeyondBabyCo formulations are free from parabens, sulfates, and phthalates. Full ingredient lists are on every product page.",
          category: "Products",
        },
        {
          question: "What makes your baby wipes different?",
          answer:
            "Our 99% Pure Water Baby Wipes use ultra-purified water with aloe vera and vitamin E. They are dermatologically tested and free from harsh chemicals.",
          category: "Products",
        },
        {
          question: "Do you offer Cash on Delivery (COD)?",
          answer:
            "Yes. COD is available on eligible pin codes at checkout. Prepaid orders via Razorpay (UPI, cards, net banking) ship after payment confirmation.",
          category: "Shipping",
        },
        {
          question: "How long does delivery take?",
          answer:
            "Standard delivery takes 3–7 business days for metro cities and 5–10 business days elsewhere. Tracking is shared once your order is dispatched.",
          category: "Shipping",
        },
        {
          question: "Do you ship across India?",
          answer:
            "Yes. We deliver to serviceable pin codes across India through Delhivery, Blue Dart, DTDC, and India Post. Enter your pin code at checkout to confirm availability.",
          category: "Shipping",
        },
        {
          question: "How can I track my order?",
          answer:
            "Once dispatched, you receive a tracking link via email and SMS. You can also view status in your account under Orders.",
          category: "Shipping",
        },
        {
          question: "What is your return policy?",
          answer:
            "Eligible unopened products may be returned within 7 days of delivery. Opened personal care items cannot be returned for hygiene reasons unless defective. See our Return Policy for details.",
          category: "Returns",
        },
        {
          question: "What if my product arrives damaged?",
          answer:
            `Contact us at ${brandSupportEmail()} within 48 hours with photos. We will arrange a free replacement or full refund.`,
          category: "Returns",
        },
      ],
    },
    {
      type: "cta",
      title: "Still have questions?",
      description: "Our support team is ready to help.",
      primary: { label: "Contact Us", href: "/contact" },
    },
  ],
};
