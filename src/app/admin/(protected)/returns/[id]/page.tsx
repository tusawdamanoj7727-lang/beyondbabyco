import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getReturnDetail, getReturnTimeline } from "@/lib/admin/returns";
import ReturnDetailClient from "./ReturnDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ret = await getReturnDetail(id);
  return { title: ret ? `RMA ${ret.rmaNumber}` : "Return" };
}

export default async function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.RETURNS_MANAGE);
  const { id } = await params;

  const ret = await getReturnDetail(id);
  if (!ret) notFound();

  const timeline = await getReturnTimeline(id);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Returns"
        title={ret.rmaNumber}
        description={`Order ${ret.orderNumber} · ${ret.customerName}`}
      />
      <ReturnDetailClient ret={ret} timeline={timeline} />
    </div>
  );
}
