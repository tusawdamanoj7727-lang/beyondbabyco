import { redirect } from "next/navigation";

import AccountNav from "@/components/account/AccountNav";
import { requireCustomerSession } from "@/lib/orders/customer-auth";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "My Account",
  description: "Manage orders, profile, addresses, and support.",
  path: "/account",
  noIndex: true,
});

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCustomerSession();
  if (!user) redirect("/login?redirectTo=/account");

  return (
    <div className="min-h-screen bg-cream-50 pb-12">
      <div className="relative overflow-hidden border-b border-green-100/80 bg-gradient-to-b from-white via-cream-50 to-cream-50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_12%_0%,color-mix(in_srgb,var(--green-100)_40%,transparent),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-6 pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600">My Account</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-green-900">Welcome back</h1>
          <p className="mt-1 text-sm text-green-700/70">Manage orders, addresses, and your profile.</p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4">
        <AccountNav />
        <div className="account-content">{children}</div>
      </div>
    </div>
  );
}
