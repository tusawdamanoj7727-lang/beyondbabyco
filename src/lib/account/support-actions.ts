"use server";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { onContactFormSubmitted } from "@/lib/email/events/admin";

const contactSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  subject: z.string().trim().min(3),
  message: z.string().trim().min(10),
});

export type SupportFaq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
};

export async function submitContactQueryAction(input: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; error: string | null }> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid form." };

  const supabase = await createSupabaseServerClient();
  const client = supabase as unknown as SupabaseClient;
  const { error } = await client.from("contact_queries").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    subject: parsed.data.subject,
    message: parsed.data.message,
    status: "new",
  });

  if (error) return { ok: false, error: error.message };
  await onContactFormSubmitted(parsed.data);
  return { ok: true, error: null };
}

export async function getPublishedFaqsAction(): Promise<SupportFaq[]> {
  const supabase = await createSupabaseServerClient();
  const client = supabase as unknown as SupabaseClient;
  const { data, error } = await client
    .from("faqs")
    .select("id, question, answer, category")
    .eq("is_published", true)
    .order("position", { ascending: true })
    .limit(24);

  if (error || !data) return [];

  return (data as SupportFaq[]).map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category ?? null,
  }));
}
