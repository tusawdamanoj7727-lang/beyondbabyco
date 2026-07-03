"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, Mail, MessageSquare, RotateCcw } from "lucide-react";

import { Mascot } from "@/components/mascots";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { submitContactQueryAction } from "@/lib/account/support-actions";
import { brandSupportEmail, brandSupportMailto } from "@/lib/brand/contact";
import { formControl, interactiveSurface } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

type Faq = { id: string; question: string; answer: string; category: string | null };

export default function SupportClient({
  faqs,
  customerName,
  customerEmail,
  orderId,
  initialSubject,
}: {
  faqs: Faq[];
  customerName: string;
  customerEmail: string;
  orderId?: string | null;
  initialSubject?: string;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [openFaq, setOpenFaq] = useState<string | null>(faqs[0]?.id ?? null);
  const [form, setForm] = useState({
    name: customerName,
    email: customerEmail,
    phone: "",
    subject: initialSubject ?? (orderId ? `Order support — ${orderId.slice(0, 8)}` : "General enquiry"),
    message: orderId ? `I need help with order ${orderId}.\n\n` : "",
  });

  function submitContact(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitContactQueryAction(form);
      if (!result.ok) {
        toast.error(result.error ?? "Could not send message");
        return;
      }
      toast.success("Message sent — we'll reply soon");
      setForm((f) => ({ ...f, message: "", subject: "General enquiry" }));
    });
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold text-green-900">Support Center</h1>
          <p className="mt-1 text-green-700/70">We&apos;re here to help you and your little one.</p>
        </div>
        <Mascot mascot="bella-bunny" pose="peek" size={120} animated alt="" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SupportCard
          href="/account/orders"
          icon={MessageSquare}
          title="Order support"
          description="Track or ask about an order"
        />
        <SupportCard
          href="/account/support#returns"
          icon={RotateCcw}
          title="Returns"
          description="Guidance for returns and exchanges"
        />
        <SupportCard
          href={brandSupportMailto()}
          icon={Mail}
          title="Email us"
          description={brandSupportEmail()}
        />
      </div>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-heading text-lg font-bold text-green-900">
          Frequently asked questions
        </h2>
        {faqs.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-green-100 bg-gradient-to-b from-cream-50 to-white px-6 py-10 text-center">
            <Mascot mascot="gigi-giraffe" pose="reading" size={96} animated floating alt="" />
            <p className="mt-4 font-heading font-semibold text-green-900">We&apos;re preparing answers</p>
            <p className="mt-2 text-sm text-green-700/70">
              Browse products or contact us — our team responds within one business day.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {faqs.map((faq) => (
              <li key={faq.id} className="rounded-2xl border border-green-100 bg-white/90">
                <button
                  type="button"
                  aria-expanded={openFaq === faq.id}
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-semibold text-green-900"
                >
                  {faq.question}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition ${openFaq === faq.id ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === faq.id ? (
                  <p className="border-t border-green-50 px-4 py-3 text-sm text-green-700/90">{faq.answer}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="returns" className="rounded-3xl border border-green-100 bg-gradient-to-br from-green-50/70 to-cream-50 p-6">
        <h2 className="font-heading text-lg font-bold text-green-900">Return requests</h2>
        <p className="mt-2 text-sm text-green-700/80">
          Contact our care team with your order number and we&apos;ll guide you through returns and exchanges.
        </p>
      </section>

      <section aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="font-heading text-lg font-bold text-green-900">
          Contact form
        </h2>
        <form onSubmit={submitContact} className="mt-4 grid gap-4 rounded-3xl border border-green-100 bg-white/90 p-6 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-green-800">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={cn("mt-1 w-full", formControl, "text-sm")}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-green-800">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={cn("mt-1 w-full", formControl, "text-sm")}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-green-800">Subject</span>
            <input
              required
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className={cn("mt-1 w-full", formControl, "text-sm")}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-green-800">Message</span>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className={cn("mt-1 w-full", formControl, "text-sm")}
            />
          </label>
          <div className="sm:col-span-2">
            <Button variant="primary" type="submit" disabled={pending}>
              Send message
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SupportCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Mail;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className={cn(interactiveSurface, "rounded-2xl border border-green-100 bg-white/90 p-5 shadow-sm")}
    >
      <Icon className="h-6 w-6 text-green-600" aria-hidden="true" />
      <p className="mt-3 font-heading font-semibold text-green-900">{title}</p>
      <p className="mt-1 text-sm text-green-700/70">{description}</p>
    </Link>
  );
}
