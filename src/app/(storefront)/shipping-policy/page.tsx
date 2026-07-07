import LegalPageShell from "@/components/legal/LegalPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Shipping Policy",
  description: "BeyondBabyCo shipping rates, delivery timelines, and courier partners across India.",
  path: "/shipping-policy",
});

export default function ShippingPolicyPage() {
  return (
    <LegalPageShell title="Shipping Policy">
      <p>
        We want your BeyondBabyCo order to reach you quickly and safely. This policy covers shipping charges,
        delivery timelines, and how we fulfil orders across India.
      </p>

      <h2>Shipping charges</h2>
      <ul>
        <li>
          <strong>Free shipping</strong> on all orders of <strong>₹999 and above</strong>.
        </li>
        <li>
          <strong>Standard shipping: ₹49</strong> for orders below ₹999.
        </li>
        <li>Shipping charges are calculated at checkout before payment.</li>
      </ul>

      <h2>Delivery timeline</h2>
      <ul>
        <li>
          <strong>Metro cities:</strong> 3–5 business days after dispatch
        </li>
        <li>
          <strong>Other locations:</strong> 5–7 business days after dispatch
        </li>
        <li>Orders are typically dispatched within 1–2 business days of confirmation.</li>
        <li>Delivery timelines may extend during festivals, sale periods, or severe weather.</li>
      </ul>

      <h2>Order processing</h2>
      <ol>
        <li>Order confirmed — you receive an email/SMS confirmation.</li>
        <li>Order packed — items are quality-checked and packed securely.</li>
        <li>Order dispatched — tracking details shared via email/SMS.</li>
        <li>Out for delivery — courier partner delivers to your address.</li>
      </ol>

      <h2>Courier partner — Shiprocket</h2>
      <p>
        We fulfil orders through <strong>Shiprocket</strong> and trusted courier partners (Delhivery, Blue
        Dart, DTDC, and others depending on your pin code). Tracking links are shared once your order is
        dispatched.
      </p>

      <h2>Cash on Delivery (COD)</h2>
      <p>
        COD is available on eligible pin codes. A small COD handling fee may apply at checkout. Please keep
        exact change ready for the delivery executive.
      </p>

      <h2>Serviceable areas</h2>
      <p>
        We currently deliver across India. If your pin code is not serviceable, you will be notified at
        checkout before payment.
      </p>

      <h2>Delivery issues</h2>
      <p>
        If your order is delayed, lost, or arrives damaged, contact us within <strong>48 hours</strong> at{" "}
        <a href="mailto:care@beyondbabyco.com">care@beyondbabyco.com</a> with your order number. We will
        coordinate with our courier partner to resolve the issue.
      </p>

      <h2>Contact</h2>
      <p>
        Email: <a href="mailto:care@beyondbabyco.com">care@beyondbabyco.com</a>
        <br />
        WhatsApp: +91 72968 87936
        <br />
        Support hours: Monday–Saturday, 10 AM – 6 PM IST
      </p>
    </LegalPageShell>
  );
}
