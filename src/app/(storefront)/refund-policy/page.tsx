import LegalPageShell from "@/components/legal/LegalPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Refund & Return Policy",
  description:
    "BeyondBabyCo 7-day return policy for unopened baby care products. Refunds processed within 5–7 business days.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <LegalPageShell title="Refund & Return Policy">
      <p>
        We stand behind the quality of every BeyondBabyCo product. If you are not satisfied, here is how
        returns and refunds work.
      </p>

      <h2>7-day return window</h2>
      <p>
        You may request a return within <strong>7 days of delivery</strong> for eligible products. The return
        window starts from the date shown on your delivery confirmation.
      </p>

      <h2>Eligibility</h2>
      <ul>
        <li>
          <strong>Unopened products only</strong> — seals intact, original packaging undamaged.
        </li>
        <li>Product must be in resalable condition.</li>
        <li>Opened, used, or tampered products cannot be returned (hygiene and safety reasons).</li>
        <li>Freebies and promotional items are non-returnable unless defective.</li>
      </ul>

      <h2>Non-returnable items</h2>
      <ul>
        <li>Opened baby wipes packs</li>
        <li>Products with broken safety seals</li>
        <li>Items marked as final sale</li>
        <li>Gift cards or digital products</li>
      </ul>

      <h2>How to request a return</h2>
      <ol>
        <li>
          Email <a href="mailto:care@beyondbabyco.com">care@beyondbabyco.com</a> with your order number,
          product name, and reason for return.
        </li>
        <li>Our team will confirm eligibility within 1–2 business days.</li>
        <li>Once approved, we will arrange a pickup or provide return instructions.</li>
        <li>After we receive and inspect the product, your refund will be initiated.</li>
      </ol>

      <h2>Refund timeline</h2>
      <ul>
        <li>
          Refunds are processed within <strong>5–7 business days</strong> after we receive the returned
          product.
        </li>
        <li>Refunds are credited to your original payment method (Razorpay / bank / UPI).</li>
        <li>COD orders are refunded via bank transfer — we will request your account details.</li>
        <li>Shipping charges are non-refundable unless the return is due to our error or a defective product.</li>
      </ul>

      <h2>Defective or wrong items</h2>
      <p>
        If you receive a defective, damaged, or incorrect product, contact us within{" "}
        <strong>48 hours</strong> with photos. We will arrange a free replacement or full refund including
        shipping charges.
      </p>

      <h2>Exchanges</h2>
      <p>
        We do not offer direct exchanges. To swap a product, return the original item (if eligible) and place
        a new order for the desired product.
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
