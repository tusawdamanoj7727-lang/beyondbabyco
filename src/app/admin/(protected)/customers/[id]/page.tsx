import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  getCustomerActivity,
  getCustomerAddresses,
  getCustomerCart,
  getCustomerDetail,
  getCustomerLoyalty,
  getCustomerOrders,
  getCustomerReferrals,
  getCustomerReviews,
  getCustomerTickets,
  getCustomerWishlist,
} from "@/lib/admin/customers";
import CustomerDetailClient from "./CustomerDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const customer = await getCustomerDetail(id);
  return { title: customer ? customer.fullName : "Customer" };
}

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);
  const { id } = await params;
  const sp = await searchParams;

  const customer = await getCustomerDetail(id);
  if (!customer) notFound();

  const [orders, addresses, wishlist, cart, reviews, tickets, loyalty, referrals, activity] = await Promise.all([
    getCustomerOrders(id),
    getCustomerAddresses(id),
    getCustomerWishlist(id),
    getCustomerCart(id),
    getCustomerReviews(id),
    getCustomerTickets(id),
    getCustomerLoyalty(id),
    getCustomerReferrals(id),
    getCustomerActivity(id),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Customers" title={customer.fullName} description={customer.email ?? customer.phone ?? "Customer profile"} />
      <CustomerDetailClient
        customer={customer}
        orders={orders}
        addresses={addresses}
        wishlist={wishlist}
        cart={cart}
        reviews={reviews}
        tickets={tickets}
        loyalty={loyalty}
        referrals={referrals}
        activity={activity}
        initialTab={sp.tab}
      />
    </div>
  );
}
