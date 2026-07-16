"use client";

import Link from "next/link";

import Button from "@/components/ui/Button";

const CANCELLABLE = new Set(["pending", "draft"]);

export default function OrderDetailActions({ orderId, status }: { orderId: string; status: string }) {
  const canCancel = CANCELLABLE.has(status);
  const supportHref = `/account/support?order=${encodeURIComponent(orderId)}`;

  return (
    <div className="flex flex-wrap gap-3">
      {canCancel ? (
        <Button asChild variant="secondary" size="sm">
          <Link href={`${supportHref}&subject=${encodeURIComponent("Cancel order request")}`}>
            Request cancellation
          </Link>
        </Button>
      ) : null}
      <Button asChild variant="secondary" size="sm">
        <Link href={`${supportHref}&subject=${encodeURIComponent("Return request")}`}>Request return</Link>
      </Button>
      <Link
        href={supportHref}
        className="inline-flex min-h-[44px] items-center rounded-full border border-green-200 px-4 text-sm font-semibold text-green-800 hover:bg-green-50"
      >
        Get help
      </Link>
    </div>
  );
}

function OrderTimelinePanel({
  events,
}: {
  events: { id: string; type: string; message: string; createdAt: string }[];
}) {
  if (events.length === 0) return null;
  return (
    <section className="rounded-3xl border border-cream-200 bg-white p-5">
      <h2 className="font-heading text-lg font-bold text-green-900">Order timeline</h2>
      <ol className="mt-4 space-y-4">
        {events.map((e, i) => (
          <li key={e.id} className="flex gap-3">
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? "bg-green-500" : "bg-green-200"}`}
              aria-hidden
            />
            <div>
              <p className="text-sm font-semibold capitalize text-green-900">{e.type.replace("_", " ")}</p>
              <p className="text-sm text-green-700">{e.message}</p>
              <p className="text-xs text-green-600/60">{new Date(e.createdAt).toLocaleString("en-IN")}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export { OrderTimelinePanel };
