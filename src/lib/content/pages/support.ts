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
        "Our support team is available Monday through Saturday, 10 AM – 6 PM IST.",
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
          description: `Order help, product questions, and returns. Email: ${brandSupportEmail()}`,
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
      title: "General",
      items: [
        {
          question: "What is BeyondBabyCo?",
          answer:
            "BeyondBabyCo is a research-led baby care brand from Udaipur, India. We create gentle, dermatologically tested products including baby wipes, wash, and skin care essentials for Indian families.",
          category: "General",
        },
        {
          question: "Are BeyondBabyCo products safe for newborns?",
          answer:
            "Yes. Our products are formulated with newborn skin in mind and undergo dermatological testing. Always check individual product labels for age recommendations and perform a patch test if your baby has known sensitivities.",
          category: "General",
        },
        {
          question: "Where are BeyondBabyCo products made?",
          answer:
            "Our products are manufactured in GMP-certified facilities in India. Learn more on our Manufacturing and Certifications pages.",
          category: "General",
        },
      ],
    },
    {
      type: "faq",
      title: "Products & Ingredients",
      items: [
        {
          question: "Are your products paraben and sulfate free?",
          answer:
            "Yes. BeyondBabyCo formulations are free from parabens, sulfates, and phthalates. Full ingredient lists are available on every product page.",
          category: "Products",
        },
        {
          question: "Do you test on animals?",
          answer:
            "No. BeyondBabyCo is cruelty free. We do not test on animals and validate safety through approved dermatological and laboratory methods.",
          category: "Products",
        },
        {
          question: "What makes your baby wipes different?",
          answer:
            "Our 99% Pure Water Baby Wipes use ultra-purified water as the primary ingredient, with aloe vera and vitamin E for gentle cleansing. They are dermatologically tested and free from harsh chemicals.",
          category: "Products",
        },
      ],
    },
    {
      type: "faq",
      title: "Orders & Shipping",
      items: [
        {
          question: "How long does delivery take?",
          answer:
            "Standard delivery takes 3–7 business days for metro cities and 5–10 business days for other locations. You will receive tracking information once your order is dispatched.",
          category: "Orders",
        },
        {
          question: "Do you ship across India?",
          answer:
            "Yes. We deliver to all serviceable pin codes in India. Enter your pin code at checkout to confirm availability.",
          category: "Orders",
        },
        {
          question: "How can I track my order?",
          answer:
            "Once dispatched, you will receive a tracking link via email and SMS. You can also view order status in your account under Orders.",
          category: "Orders",
        },
      ],
    },
    {
      type: "faq",
      title: "Returns & Refunds",
      items: [
        {
          question: "What is your return policy?",
          answer:
            "Eligible unopened products may be returned within 7 days of delivery. Opened personal care items cannot be returned for hygiene reasons unless defective. See our Return Policy for full details.",
          category: "Returns",
        },
        {
          question: "How long do refunds take?",
          answer:
            "Approved refunds are processed within 5–7 business days to your original payment method. Bank processing may add 3–5 additional days.",
          category: "Returns",
        },
        {
          question: "What if my product arrives damaged?",
          answer:
            `Contact us at ${brandSupportEmail()} within 48 hours with photos of the damage. We will arrange a free replacement or full refund.`,
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
