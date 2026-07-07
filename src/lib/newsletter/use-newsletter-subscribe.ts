"use client";

import { useCallback, useRef, useState } from "react";

import { NEWSLETTER_MESSAGES } from "@/lib/newsletter/messages";

export type NewsletterStatus = "idle" | "loading" | "success" | "error";

type SubscribeResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

type UseNewsletterSubscribeOptions = {
  mapSuccessMessage?: (data: SubscribeResponse) => string;
};

export function useNewsletterSubscribe(
  source: string,
  options?: UseNewsletterSubscribeOptions,
) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<NewsletterStatus>("idle");
  const [msg, setMsg] = useState("");

  const mapSuccessMessageRef = useRef(options?.mapSuccessMessage);
  mapSuccessMessageRef.current = options?.mapSuccessMessage;

  const handleSubscribe = useCallback(
    async (overrideEmail?: string) => {
      const value = (overrideEmail ?? email).trim();
      if (!value.includes("@")) return;

      setStatus("loading");
      setMsg("");

      try {
        const res = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: value, source }),
        });

        const data = (await res.json()) as SubscribeResponse;

        if (data.error) {
          setStatus("error");
          setMsg(data.error);
          return;
        }

        setStatus("success");
        setMsg(
          mapSuccessMessageRef.current?.(data) ??
            data.message ??
            NEWSLETTER_MESSAGES.success,
        );
        setEmail("");
      } catch {
        setStatus("error");
        setMsg(NEWSLETTER_MESSAGES.error);
      }
    },
    [email, source],
  );

  return { email, setEmail, status, msg, handleSubscribe };
}
