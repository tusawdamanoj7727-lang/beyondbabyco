import type { ContentPage } from "@/lib/content/types";
import { brandSupportEmail } from "@/lib/brand/contact";

const COMPANY = "Tusawda Global Private Limited";
const BRAND = "BeyondBabyCo";
const EMAIL = brandSupportEmail();
const ADDRESS = "Udaipur, Rajasthan, India";
const LAST_UPDATED = "1 July 2026";

export const privacyPolicyPage: ContentPage = {
  slug: "privacy-policy",
  title: "Privacy Policy",
  description:
    "How BeyondBabyCo collects, uses, and protects your personal information. Read our privacy policy for Indian customers.",
  eyebrow: "Legal",
  relatedLinks: [
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Cookies Policy", href: "/cookies" },
    { label: "Contact", href: "/contact" },
  ],
  sections: [
    {
      type: "legal",
      lastUpdated: LAST_UPDATED,
      sections: [
        {
          title: "1. Introduction",
          paragraphs: [
            `${COMPANY} ("we", "us", "our") operates the ${BRAND} website and online store. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, create an account, or make a purchase.`,
            "By using our services, you consent to the data practices described in this policy. We comply with the Information Technology Act, 2000 and applicable rules including the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.",
          ],
        },
        {
          title: "2. Information We Collect",
          paragraphs: [
            "Personal information you provide: name, email address, phone number, delivery address, and payment-related information when you register, place an order, or contact us.",
            "Automatically collected information: IP address, browser type, device information, pages visited, and cookies (see our Cookies Policy).",
            "Order and transaction data: products purchased, order history, shipping details, and payment status.",
          ],
        },
        {
          title: "3. How We Use Your Information",
          paragraphs: [
            "To process and fulfil your orders, including shipping and delivery coordination.",
            "To process payments securely through our payment partner Razorpay Software Private Limited and other authorised payment gateways.",
            "To communicate with you about orders, account activity, and customer support enquiries.",
            "To send marketing communications where you have opted in (you may unsubscribe at any time).",
            "To improve our website, products, and services through analytics and feedback.",
            "To comply with legal obligations, GST and tax reporting requirements, and prevent fraud.",
          ],
        },
        {
          title: "4. Payment Information",
          paragraphs: [
            "When you pay online, card, UPI, net banking, and wallet details are processed directly by Razorpay and partner banks. BeyondBabyCo does not store your full card number or UPI PIN on our servers.",
            "We may receive limited transaction metadata (payment status, last four digits where applicable, and Razorpay payment ID) to reconcile orders and process refunds.",
            "Razorpay's privacy practices are governed by their own policy at razorpay.com/privacy.",
          ],
        },
        {
          title: "5. Sharing Your Information",
          paragraphs: [
            "We do not sell your personal information. We may share data with trusted service providers who assist in operating our website, processing payments, shipping orders, and sending communications — each bound by confidentiality obligations.",
            "We may disclose information if required by law, court order, or government authority.",
          ],
        },
        {
          title: "6. Data Security",
          paragraphs: [
            "We implement reasonable security practices including encryption, access controls, and secure hosting. However, no method of transmission over the internet is 100% secure.",
          ],
        },
        {
          title: "7. Your Rights",
          paragraphs: [
            "You may request access to, correction of, or deletion of your personal data by emailing us at " + EMAIL + ".",
            "You may opt out of marketing emails using the unsubscribe link in any promotional message.",
            "You may disable cookies through your browser settings (see our Cookies Policy).",
          ],
        },
        {
          title: "8. Data Retention",
          paragraphs: [
            "We retain personal information for as long as necessary to fulfil the purposes outlined in this policy, comply with legal obligations, and resolve disputes.",
          ],
        },
        {
          title: "9. Children's Privacy",
          paragraphs: [
            "Our website is intended for use by parents and guardians. We do not knowingly collect personal information from children under 18 without parental consent.",
          ],
        },
        {
          title: "10. Grievance Officer (India)",
          paragraphs: [
            "In accordance with the Information Technology Act, 2000 and applicable rules, you may contact our Grievance Officer for privacy-related complaints:",
            `Name: Customer Care — ${BRAND}`,
            `Email: ${EMAIL}`,
            `Address: ${ADDRESS}`,
            "We aim to acknowledge grievances within 48 hours and resolve them within 30 days.",
          ],
        },
        {
          title: "11. Contact Us",
          paragraphs: [
            `${COMPANY} (${BRAND})`,
            `Email: ${EMAIL}`,
            `Address: ${ADDRESS}`,
          ],
        },
      ],
    },
    {
      type: "cta",
      title: "Questions about your data?",
      description: "Our team is happy to help with any privacy-related enquiry.",
      primary: { label: "Contact Us", href: "/contact" },
    },
  ],
};

export const termsPage: ContentPage = {
  slug: "terms-of-service",
  title: "Terms of Service",
  description:
    "Terms and conditions for using the BeyondBabyCo website and purchasing products. Operated by Tusawda Global Private Limited.",
  eyebrow: "Legal",
  relatedLinks: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Refund Policy", href: "/refund-policy" },
  ],
  sections: [
    {
      type: "legal",
      lastUpdated: LAST_UPDATED,
      sections: [
        {
          title: "1. Agreement to Terms",
          paragraphs: [
            `These Terms of Service ("Terms") govern your use of the ${BRAND} website (the "Site") operated by ${COMPANY}, registered in India with operations in ${ADDRESS}.`,
            "By accessing or using the Site, you agree to be bound by these Terms. If you do not agree, please do not use the Site.",
          ],
        },
        {
          title: "2. Products and Pricing",
          paragraphs: [
            "All products are subject to availability. We reserve the right to limit quantities, discontinue products, or correct pricing errors at any time.",
            "Prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise. Shipping charges are calculated at checkout.",
          ],
        },
        {
          title: "3. Orders and Payment",
          paragraphs: [
            "Placing an order constitutes an offer to purchase. We may accept or reject any order at our discretion.",
            "We accept online payments via Razorpay (credit/debit cards, UPI, net banking, and supported wallets) and Cash on Delivery (COD) where available at checkout.",
            "Payment is processed through secure third-party payment gateways. You represent that you are authorised to use the payment method provided.",
            "For COD orders, payment is collected at delivery. Failed delivery or refusal to pay may affect future COD eligibility.",
          ],
        },
        {
          title: "4. Account Registration",
          paragraphs: [
            "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.",
            "You must provide accurate and complete information when creating an account.",
          ],
        },
        {
          title: "5. Intellectual Property",
          paragraphs: [
            "All content on the Site — including text, images, logos, and designs — is the property of " + COMPANY + " and protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our written consent.",
          ],
        },
        {
          title: "6. Limitation of Liability",
          paragraphs: [
            "To the fullest extent permitted by law, " + COMPANY + " shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Site or products.",
            "Our total liability for any claim shall not exceed the amount you paid for the relevant product.",
          ],
        },
        {
          title: "7. Governing Law",
          paragraphs: [
            "These Terms are governed by the laws of India, including the Consumer Protection Act, 2019 where applicable to consumer transactions.",
            "Any disputes shall be subject to the exclusive jurisdiction of the courts in Udaipur, Rajasthan.",
          ],
        },
        {
          title: "8. Changes to Terms",
          paragraphs: [
            "We may update these Terms from time to time. Continued use of the Site after changes constitutes acceptance of the revised Terms.",
          ],
        },
        {
          title: "9. Contact",
          paragraphs: [`Email: ${EMAIL}`, `Address: ${ADDRESS}`],
        },
      ],
    },
  ],
};

export const shippingPolicyPage: ContentPage = {
  slug: "shipping-policy",
  title: "Shipping Policy",
  description:
    "BeyondBabyCo shipping information — delivery areas, timelines, tracking, and shipping charges across India.",
  eyebrow: "Legal",
  relatedLinks: [
    { label: "Return Policy", href: "/refund-policy" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "FAQ", href: "/faq" },
  ],
  sections: [
    {
      type: "legal",
      lastUpdated: LAST_UPDATED,
      sections: [
        {
          title: "1. Delivery Areas",
          paragraphs: [
            "We currently ship to all serviceable pin codes across India through our logistics partners. Delivery availability is confirmed at checkout based on your pin code.",
          ],
        },
        {
          title: "2. Processing Time",
          paragraphs: [
            "Orders are typically processed within 1–2 business days after payment confirmation (prepaid) or order confirmation (COD). Orders placed on weekends or public holidays are processed on the next business day.",
          ],
        },
        {
          title: "3. Courier Partners",
          paragraphs: [
            "We ship through trusted logistics partners including Delhivery, Blue Dart, DTDC, and India Post (speed post) depending on your pin code and service availability.",
            "The assigned courier will be selected automatically for the fastest reliable delivery to your location.",
          ],
        },
        {
          title: "4. Delivery Timelines",
          paragraphs: [
            "Standard delivery: 3–7 business days for metro cities; 5–10 business days for other locations.",
            "Actual delivery times may vary based on location, weather, and carrier availability. You will receive tracking information once your order is dispatched.",
          ],
        },
        {
          title: "5. Shipping Charges & Free Delivery",
          paragraphs: [
            "Shipping charges are calculated at checkout based on your delivery location and order value. Free standard shipping is available on prepaid orders of ₹999 and above (before discounts, where applicable).",
            "COD orders may incur a nominal COD handling fee shown at checkout.",
          ],
        },
        {
          title: "6. Payment Methods at Delivery",
          paragraphs: [
            "Prepaid: Pay securely online via Razorpay at checkout — your order ships after payment confirmation.",
            "Cash on Delivery (COD): Pay in cash to the courier executive when your order arrives. Please keep exact change ready where possible.",
          ],
        },
        {
          title: "7. Order Tracking",
          paragraphs: [
            "Once dispatched, you will receive a tracking link via email and SMS. You can also track your order from your account dashboard under Orders.",
          ],
        },
        {
          title: "8. Delivery Issues",
          paragraphs: [
            "If your order is delayed, damaged in transit, or not delivered, please contact us at " + EMAIL + " within 48 hours of the expected delivery date. We will work with our logistics partner to resolve the issue promptly.",
          ],
        },
        {
          title: "9. Undeliverable Orders",
          paragraphs: [
            "If a delivery attempt fails due to an incorrect address or unavailability, the order may be returned to us. Re-shipping charges may apply.",
          ],
        },
      ],
    },
    {
      type: "cta",
      title: "Need help with an order?",
      description: "Our support team responds within one business day.",
      primary: { label: "Contact Support", href: "/contact" },
      secondary: { label: "FAQ", href: "/faq" },
    },
  ],
};

export const refundPolicyPage: ContentPage = {
  slug: "refund-policy",
  title: "Refund Policy",
  description:
    "BeyondBabyCo refund policy — eligibility, processing times, and how refunds are issued for online orders in India.",
  eyebrow: "Legal",
  relatedLinks: [
    { label: "Return Policy", href: "/refund-policy" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Contact", href: "/contact" },
  ],
  sections: [
    {
      type: "legal",
      lastUpdated: LAST_UPDATED,
      sections: [
        {
          title: "1. Return Window — 7 Days",
          paragraphs: [
            "You may return eligible products within 7 days of delivery for a refund or exchange, provided the items meet the conditions in our Return Policy.",
            "The 7-day window begins on the date of delivery as confirmed by the courier tracking status.",
          ],
        },
        {
          title: "2. Refund Eligibility",
          paragraphs: [
            "Refunds are issued for eligible returns as described in our Return Policy, for cancelled orders before dispatch, and for orders that cannot be fulfilled.",
            "Products must be returned in their original condition with seals intact (where applicable) to qualify for a full refund.",
          ],
        },
        {
          title: "3. Non-Refundable Items",
          paragraphs: [
            "Opened or used personal care products (for hygiene reasons) unless the product is defective or damaged on arrival.",
            "Products returned after the 7-day return window.",
            "Shipping charges are non-refundable unless the return is due to our error or a defective product.",
          ],
        },
        {
          title: "4. Refund Process",
          paragraphs: [
            "Email " + EMAIL + " with your order number, item(s) to return, and reason. Our team will confirm eligibility within 1 business day.",
            "Once we receive and inspect your returned item, we will notify you of approval or rejection.",
            "Approved refunds are initiated within 5–7 business days to your original payment method (Razorpay / bank). Bank processing may add 3–5 additional business days.",
            "For COD orders, refunds are processed via UPI or bank transfer — we will collect your details securely after return approval.",
          ],
        },
        {
          title: "5. Partial Refunds",
          paragraphs: [
            "Partial refunds may be issued for items not in their original condition, items returned after 7 days, or items missing parts not due to our error.",
          ],
        },
        {
          title: "6. Defective or Damaged Products",
          paragraphs: [
            "If you receive a defective or damaged product, contact us at " + EMAIL + " within 48 hours with photos. We will arrange a replacement or full refund including shipping charges.",
          ],
        },
        {
          title: "7. Contact",
          paragraphs: [
            "For refund and return enquiries:",
            `Email: ${EMAIL}`,
            `Company: ${COMPANY} (${BRAND})`,
            `Address: ${ADDRESS}`,
            "Support hours: Monday – Saturday, 10:00 AM – 6:00 PM IST",
          ],
        },
      ],
    },
  ],
};

export const returnPolicyPage: ContentPage = {
  slug: "return-policy",
  title: "Return Policy",
  description:
    "How to return BeyondBabyCo products — eligibility, return window, process, and conditions for baby care product returns.",
  eyebrow: "Legal",
  relatedLinks: [
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "FAQ", href: "/faq" },
  ],
  sections: [
    {
      type: "legal",
      lastUpdated: LAST_UPDATED,
      sections: [
        {
          title: "1. Return Window",
          paragraphs: [
            "You may return eligible products within 7 days of delivery for a refund or exchange, provided the items meet the conditions below.",
          ],
        },
        {
          title: "2. Return Conditions",
          paragraphs: [
            "Products must be unused, unopened, and in their original packaging with all seals intact.",
            "Baby wipes and personal care products that have been opened cannot be returned for hygiene and safety reasons, unless they arrived damaged or defective.",
            "Include your order number and reason for return in your return request.",
          ],
        },
        {
          title: "3. How to Initiate a Return",
          paragraphs: [
            "Email us at " + EMAIL + " with your order number, item(s) to return, and reason.",
            "Our team will confirm eligibility and provide return instructions including the pickup or shipping address.",
            "If you have an account, you may also initiate a return from your order history.",
          ],
        },
        {
          title: "4. Return Shipping",
          paragraphs: [
            "Return shipping costs are borne by the customer unless the return is due to a defective, damaged, or incorrect item sent by us.",
            "We recommend using a trackable shipping service for returns.",
          ],
        },
        {
          title: "5. Exchanges",
          paragraphs: [
            "If you need a different product or variant, contact us and we will guide you through the exchange process. Exchanges are subject to product availability.",
          ],
        },
        {
          title: "6. Damaged on Arrival",
          paragraphs: [
            "If your order arrives damaged, photograph the packaging and product and contact us within 48 hours. We will arrange a free replacement or full refund.",
          ],
        },
      ],
    },
    {
      type: "cta",
      title: "Start a return",
      description: "Contact our support team to begin the return process.",
      primary: { label: "Contact Support", href: "/contact" },
      secondary: { label: "Refund Policy", href: "/refund-policy" },
    },
  ],
};

export const cookiesPage: ContentPage = {
  slug: "cookies",
  title: "Cookies Policy",
  description:
    "How BeyondBabyCo uses cookies and similar technologies on our website. Learn about cookie types and how to manage preferences.",
  eyebrow: "Legal",
  relatedLinks: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
  ],
  sections: [
    {
      type: "legal",
      lastUpdated: LAST_UPDATED,
      sections: [
        {
          title: "1. What Are Cookies",
          paragraphs: [
            "Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences, keep you logged in, and understand how you use our services.",
          ],
        },
        {
          title: "2. Cookies We Use",
          paragraphs: [
            "Essential cookies: Required for the Site to function — including authentication, cart management, and security. These cannot be disabled.",
            "Analytics cookies: Help us understand how visitors use the Site (pages visited, time spent) so we can improve the experience.",
            "Preference cookies: Remember your settings such as language or display preferences.",
          ],
        },
        {
          title: "3. Third-Party Cookies",
          paragraphs: [
            "Our payment processors and analytics providers may set their own cookies. We do not control these cookies — please refer to their respective privacy policies.",
          ],
        },
        {
          title: "4. Managing Cookies",
          paragraphs: [
            "You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. Note that disabling essential cookies may affect Site functionality.",
            "To opt out of analytics tracking, adjust your browser settings or use browser extensions designed for privacy.",
          ],
        },
        {
          title: "5. Updates",
          paragraphs: [
            "We may update this Cookies Policy from time to time. The last updated date at the top of this page reflects the most recent revision.",
          ],
        },
        {
          title: "6. Contact",
          paragraphs: [`Questions? Email us at ${EMAIL}.`],
        },
      ],
    },
  ],
};
