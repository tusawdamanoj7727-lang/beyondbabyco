"use client";

import { useState, type FormEvent } from "react";

import Button from "@/components/ui/Button";
import { focusRing } from "@/lib/design/ui";
import { submitContactQueryAction } from "@/lib/account/support-actions";
import { cn } from "@/lib/utils";

export default function ContactPageForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setStatusMessage("");

    const result = await submitContactQueryAction({ name, email, subject, message });

    if (result.ok) {
      setStatus("success");
      setStatusMessage("Thank you! We will get back to you within one business day.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } else {
      setStatus("error");
      setStatusMessage(result.error ?? "Something went wrong. Please email care@beyondbabyco.com directly.");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-gray-700">
          Your name
        </label>
        <input
          id="contact-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={cn(
            "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm",
            focusRing,
          )}
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={cn(
            "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm",
            focusRing,
          )}
        />
      </div>
      <div>
        <label htmlFor="contact-subject" className="mb-1 block text-sm font-medium text-gray-700">
          Subject
        </label>
        <input
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className={cn(
            "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm",
            focusRing,
          )}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className={cn(
            "w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm",
            focusRing,
          )}
        />
      </div>
      {statusMessage ? (
        <p
          role={status === "error" ? "alert" : "status"}
          className={`text-sm ${status === "success" ? "text-green-600" : "text-red-500"}`}
        >
          {statusMessage}
        </p>
      ) : null}
      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} disabled={loading}>
        Send Message
      </Button>
    </form>
  );
}
