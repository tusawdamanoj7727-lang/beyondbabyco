import Link from "next/link";

import ContactPageForm from "@/components/contact/ContactPageForm";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Contact Us",
  description: "Get in touch with BeyondBabyCo customer support via email, WhatsApp, or our contact form.",
  path: "/contact",
});

const WHATSAPP_URL = "https://wa.me/917296887936?text=Hi!%20I%20have%20a%20question%20about%20BeyondBabyCo%20products%20👶";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#faf5f0] py-16">
      <div className="mx-auto max-w-5xl px-4">
        <h1 className="mb-3 text-4xl font-black text-[#2d5a27]">Contact Us</h1>
        <p className="mb-10 text-gray-500">We are here to help — reach out anytime</p>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-gray-900">Send us a message</h2>
            <ContactPageForm />
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Get in touch</h2>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <p className="font-semibold text-gray-900">Email</p>
                  <a href="mailto:care@beyondbabyco.com" className="text-[#2d5a27] hover:underline">
                    care@beyondbabyco.com
                  </a>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">WhatsApp</p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2d5a27] hover:underline"
                  >
                    +91 72968 87936
                  </a>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Support hours</p>
                  <p>Monday–Saturday, 10 AM – 6 PM IST</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Location</p>
                  <p>Udaipur, Rajasthan, India</p>
                  <p className="mt-1 text-xs text-gray-400">Tusawda Global Private Limited</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#eaf3de] p-6">
              <p className="font-semibold text-[#2d5a27]">Quick answers?</p>
              <p className="mt-2 text-sm text-gray-600">
                Check our FAQ for instant answers about products, shipping, and returns.
              </p>
              <Link
                href="/faq"
                className="mt-4 inline-block text-sm font-semibold text-[#2d5a27] hover:underline"
              >
                View FAQ →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
