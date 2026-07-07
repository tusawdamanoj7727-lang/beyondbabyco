import Link from "next/link";

import LegalPageShell from "@/components/legal/LegalPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Terms of Service",
  description: "Terms governing use of the BeyondBabyCo website and purchase of our baby care products.",
  path: "/terms-of-service",
});

export default function TermsOfServicePage() {
  return (
    <LegalPageShell title="Terms of Service">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of the BeyondBabyCo website (
        <strong>beyondbabyco.in</strong>) and the purchase of products offered by{" "}
        <strong>Tusawda Global Private Limited</strong> (&quot;BeyondBabyCo&quot;, &quot;we&quot;, &quot;us&quot;).
        By accessing our website or placing an order, you agree to these Terms.
      </p>

      <h2>Use of website</h2>
      <ul>
        <li>You must be 18 years or older to create an account or place an order.</li>
        <li>You agree to provide accurate account and delivery information.</li>
        <li>
          You may not use our website for unlawful purposes, to transmit harmful content, or to attempt
          unauthorised access to our systems.
        </li>
        <li>We reserve the right to suspend accounts that violate these Terms.</li>
      </ul>

      <h2>Product purchases</h2>
      <ul>
        <li>All prices are listed in Indian Rupees (INR) and are inclusive of applicable GST unless stated otherwise.</li>
        <li>Product availability is subject to stock. We reserve the right to cancel orders if items are unavailable.</li>
        <li>Payment is processed securely via Razorpay (cards, UPI, net banking, wallets, and COD where available).</li>
        <li>An order is confirmed only after successful payment authorisation or COD order acceptance.</li>
        <li>We reserve the right to refuse or cancel orders at our discretion (e.g. pricing errors, suspected fraud).</li>
      </ul>

      <h2>Shipping &amp; delivery</h2>
      <p>
        Delivery timelines, shipping charges, and service areas are described in our{" "}
        <Link href="/shipping-policy">Shipping Policy</Link>. Risk of loss passes to you upon delivery to
        the address provided.
      </p>

      <h2>Returns &amp; refunds</h2>
      <p>
        Returns and refunds are governed by our{" "}
        <Link href="/refund-policy">Refund &amp; Return Policy</Link>. Please review it before placing an
        order.
      </p>

      <h2>Intellectual property</h2>
      <p>
        All content on beyondbabyco.in—including logos, product names, images, mascots, text, and design—is
        owned by or licensed to Tusawda Global Private Limited. You may not reproduce, distribute, or
        create derivative works without our written permission.
      </p>
      <p>
        The BeyondBabyCo name, mascot characters (Bella, Gigi, Poppy, Eli, Penny, Benny), and product
        formulations are proprietary intellectual property of Tusawda Global Private Limited.
      </p>

      <h2>Product information disclaimer</h2>
      <p>
        We make every effort to ensure product descriptions, ingredient lists, and images are accurate.
        However, packaging may vary. Our products are intended for external use on babies as directed. Always
        patch-test on a small area and consult a paediatrician if you have concerns.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Tusawda Global Private Limited shall not be liable for
        indirect, incidental, or consequential damages arising from use of our website or products. Our total
        liability for any claim shall not exceed the amount you paid for the relevant order.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of India. Disputes shall be subject to the exclusive
        jurisdiction of courts in Udaipur, Rajasthan.
      </p>

      <h2>Changes to terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the website after changes constitutes
        acceptance of the updated Terms.
      </p>

      <h2>Contact</h2>
      <p>
        Tusawda Global Private Limited
        <br />
        Udaipur, Rajasthan, India
        <br />
        Email: <a href="mailto:care@beyondbabyco.com">care@beyondbabyco.com</a>
      </p>
    </LegalPageShell>
  );
}
