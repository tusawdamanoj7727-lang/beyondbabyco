import LegalPageShell from "@/components/legal/LegalPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Privacy Policy — BeyondBabyCo",
  description:
    "How BeyondBabyCo collects, uses, and protects your personal data under India's DPDP Act.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy — BeyondBabyCo">
      <p>
        BeyondBabyCo (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is operated by Tusawda Global Private
        Limited. This Privacy Policy explains how we collect, use, store, and protect your information when
        you visit beyondbabyco.in, create an account, or purchase our products.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account &amp; order data:</strong> name, email, phone number, delivery address, and order
          history when you shop with us.
        </li>
        <li>
          <strong>Payment data:</strong> payments are processed securely by Razorpay. We do not store full
          card or UPI credentials on our servers.
        </li>
        <li>
          <strong>Communications:</strong> messages you send via contact forms, email, or WhatsApp support.
        </li>
        <li>
          <strong>Technical data:</strong> device type, browser, IP address, and analytics cookies used to
          improve site performance.
        </li>
      </ul>

      <h2>How we use your data</h2>
      <ul>
        <li>Process and fulfil orders, including shipping updates and delivery coordination.</li>
        <li>Provide customer support and respond to enquiries.</li>
        <li>Send transactional emails (order confirmations, shipping alerts, account notices).</li>
        <li>
          Send marketing communications only when you opt in (newsletter, launch offers). You may
          unsubscribe at any time.
        </li>
        <li>Improve our website, products, and services through aggregated analytics.</li>
      </ul>

      <h2>Data storage &amp; Supabase</h2>
      <p>
        Customer accounts, order records, and support queries are stored securely using{" "}
        <strong>Supabase</strong> (PostgreSQL) with encryption in transit and at rest. Access is restricted
        to authorised personnel only. We retain order data as required for tax, accounting, and legal
        compliance under Indian law.
      </p>

      <h2>Email communications</h2>
      <p>
        We use your email address to send order updates, account notifications, and—if you subscribe—baby care
        tips and promotional offers. Marketing emails include an unsubscribe link. Transactional emails
        related to your orders cannot be opted out while you have an active purchase.
      </p>

      <h2>Sharing with third parties</h2>
      <p>We share data only with trusted partners necessary to operate our business:</p>
      <ul>
        <li>
          <strong>Razorpay</strong> — payment processing
        </li>
        <li>
          <strong>Shiprocket / courier partners</strong> — order fulfilment and delivery
        </li>
        <li>
          <strong>Supabase</strong> — secure database hosting
        </li>
        <li>
          <strong>Email service providers</strong> — transactional and marketing email delivery
        </li>
      </ul>
      <p>We never sell your personal data to third parties.</p>

      <h2>Your rights under the DPDP Act, 2023 (India)</h2>
      <p>As a data principal under India&apos;s Digital Personal Data Protection Act, you have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>Request erasure of your data (subject to legal retention requirements)</li>
        <li>Withdraw consent for marketing communications</li>
        <li>Nominate another person to exercise your rights in the event of death or incapacity</li>
        <li>Lodge a grievance with our Grievance Officer (see below)</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use essential cookies for cart, login sessions, and site functionality. Analytics cookies help us
        understand how visitors use our site. You can manage cookie preferences in your browser settings.
      </p>

      <h2>Children&apos;s privacy</h2>
      <p>
        Our products are intended for use on babies and children under parental supervision. We do not
        knowingly collect personal data from children under 18. Accounts must be created by a parent or
        legal guardian.
      </p>

      <h2>Contact &amp; grievance officer</h2>
      <p>
        For privacy requests or complaints:
        <br />
        Email: <a href="mailto:care@beyondbabyco.com">care@beyondbabyco.com</a>
        <br />
        Company: Tusawda Global Private Limited, Udaipur, Rajasthan, India
      </p>
    </LegalPageShell>
  );
}
