"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";

import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { submitContactQueryAction } from "@/lib/account/support-actions";
import type { ContentFaqItem } from "@/lib/content/types";
import { formControl } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function FaqAccordion({ items, title }: { items: ContentFaqItem[]; title?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section aria-labelledby="content-faq-heading" className="section-padding bg-cream-50">
      <div className="container max-w-3xl">
        {title ? (
          <h2 id="content-faq-heading" className="section-heading text-center">
            {title}
          </h2>
        ) : null}
        <ul className={`space-y-2 ${title ? "mt-8" : ""}`}>
          {items.map((faq, index) => (
            <li key={faq.question} className="rounded-2xl border border-green-100 bg-white/90 shadow-sm">
              <button
                type="button"
                aria-expanded={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-heading font-semibold text-green-900"
              >
                {faq.question}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-green-700 transition ${openIndex === index ? "rotate-180" : ""}`}
                />
              </button>
              {openIndex === index ? (
                <p className="border-t border-green-50 px-5 py-4 font-body text-base leading-relaxed text-green-700/90">
                  {faq.answer}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ContactFormSection() {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General enquiry",
    message: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitContactQueryAction(form);
      if (!result.ok) {
        toast.error(result.error ?? "Could not send message");
        return;
      }
      toast.success("Message sent — we'll reply within one business day");
      setForm({ name: "", email: "", phone: "", subject: "General enquiry", message: "" });
    });
  }

  return (
    <section className="section-padding bg-white">
      <div className="container max-w-xl">
        <h2 className="font-heading text-2xl font-bold text-green-900">Send us a message</h2>
        <p className="text-body mt-2">
          Our support team responds Monday–Saturday, 10 AM – 6 PM IST.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-green-800">Name</span>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={cn("w-full", formControl)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-green-800">Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={cn("w-full", formControl)}
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-green-800">Phone (optional)</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={cn("w-full", formControl)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-green-800">Subject</span>
            <input
              required
              type="text"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className={cn("w-full", formControl)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-green-800">Message</span>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className={cn("w-full", formControl)}
            />
          </label>
          <Button variant="cta" type="submit" disabled={pending} loading={pending}>
            Send Message
          </Button>
        </form>
      </div>
    </section>
  );
}
