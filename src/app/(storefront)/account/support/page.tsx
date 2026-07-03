import { redirect } from "next/navigation";

import SupportClient from "@/components/account/SupportClient";
import JsonLd from "@/components/seo/JsonLd";
import { getCustomerProfileAction } from "@/lib/account/profile-actions";
import { getPublishedFaqsAction } from "@/lib/account/support-actions";
import { requireCustomerSession } from "@/lib/orders/customer-auth";
import { faqJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Support",
  description: "Get help with orders, returns, and product questions.",
  path: "/account/support",
  noIndex: true,
});

export default async function AccountSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; subject?: string }>;
}) {
  const user = await requireCustomerSession();
  if (!user) redirect("/login?redirectTo=/account/support");

  const [{ order: orderId, subject }, faqs, profile] = await Promise.all([
    searchParams,
    getPublishedFaqsAction(),
    getCustomerProfileAction(),
  ]);

  return (
    <>
      <JsonLd data={faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.answer })))} />
      <SupportClient
        faqs={faqs}
        customerName={profile?.fullName ?? user.email?.split("@")[0] ?? ""}
        customerEmail={profile?.email ?? user.email ?? ""}
        orderId={orderId ?? null}
        initialSubject={subject ? decodeURIComponent(subject) : undefined}
      />
    </>
  );
}
