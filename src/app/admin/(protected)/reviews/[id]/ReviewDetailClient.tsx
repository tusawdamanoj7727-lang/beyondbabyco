"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import ReviewStatusBadge from "@/components/admin/ReviewStatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import FormField, { Input, Textarea } from "@/components/admin/FormField";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/admin/LoadingState";
import {
  CUSTOMER_SEGMENT_LABELS,
  customerInitials,
  type CustomerSegment,
} from "@/lib/admin/customer-types";
import {
  starsLabel,
  type ReviewDetail,
  type ReviewTimelineEvent,
} from "@/lib/admin/review-types";
import {
  approveReview,
  deleteReview,
  deleteReviewImage,
  featureReview,
  hideReview,
  rejectReview,
  restoreReview,
  updateReviewNotes,
} from "@/lib/admin/review-actions";
import { cn } from "@/lib/utils";

type Tab = "overview" | "images" | "moderation" | "history";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ReviewDetailClient(props: { review: ReviewDetail; timeline: ReviewTimelineEvent[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState(props.review.internalNotes ?? "");
  const [reason, setReason] = useState(props.review.moderationReason ?? "");
  const [confirmAction, setConfirmAction] = useState<"reject" | "hide" | "spam" | "delete" | null>(null);
  const [pending, startTransition] = useTransition();
  const r = props.review;

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  function saveNotes() {
    run(() => updateReviewNotes(r.id, notes || null, reason || null));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-cream-200 bg-cream-50 p-4">
        <span className="text-2xl text-terra-600" aria-label={`${r.rating} out of 5 stars`}>{starsLabel(r.rating)}</span>
        <ReviewStatusBadge status={r.status} size="md" />
        {r.verifiedPurchase && <Badge variant="success" size="sm">Verified Purchase</Badge>}
        {r.isFeatured && <Badge variant="info" size="sm">Featured</Badge>}
        <div className="ml-auto flex flex-wrap gap-2">
          {r.status === "pending" && <Button size="sm" disabled={pending} onClick={() => run(() => approveReview(r.id))}>Approve</Button>}
          {r.status !== "approved" && r.status !== "rejected" && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmAction("reject")}>Reject</Button>
          )}
          {r.status !== "hidden" && <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmAction("hide")}>Hide</Button>}
          {r.status === "hidden" && <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => restoreReview(r.id))}>Restore</Button>}
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => featureReview(r.id, !r.isFeatured))}>
            {r.isFeatured ? "Unfeature" : "Feature"}
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmAction("delete")}>Delete</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="space-y-4">
          <Panel title="Customer">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-green-100 text-sm font-bold text-green-800">
                {r.customer.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.customer.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  customerInitials(r.customer.name)
                )}
              </div>
              <div>
                {r.customer.id ? (
                  <Link href={`/admin/customers/${r.customer.id}`} className="font-semibold text-green-800 hover:underline">{r.customer.name}</Link>
                ) : (
                  <p className="font-semibold text-green-900">{r.customer.name}</p>
                )}
                {r.customer.email && <p className="text-xs text-green-700/60">{r.customer.email}</p>}
                {r.customer.segment && (
                  <Badge variant="default" size="sm" className="mt-1">
                    {CUSTOMER_SEGMENT_LABELS[r.customer.segment as CustomerSegment] ?? r.customer.segment}
                  </Badge>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Product">
            <div className="flex gap-3">
              {r.product.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.product.thumbnailUrl} alt="" className="h-14 w-14 rounded-xl object-cover ring-1 ring-cream-200" />
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-xl bg-cream-100 text-green-700/30">—</div>
              )}
              <div>
                <Link href={`/admin/products/${r.product.id}`} className="font-semibold text-green-800 hover:underline">{r.product.name}</Link>
                {r.product.sku && <p className="text-xs text-green-700/60">SKU: {r.product.sku}</p>}
              </div>
            </div>
          </Panel>

          {r.order && (
            <Panel title="Order">
              <Badge variant="success" size="sm">Verified Purchase</Badge>
              <p className="mt-2 text-sm">
                <Link href={`/admin/orders/${r.order.id}`} className="font-medium text-green-800 hover:underline">{r.order.orderNumber}</Link>
              </p>
              <p className="text-xs text-green-700/60">Purchased {formatDateTime(r.order.purchaseDate)}</p>
            </Panel>
          )}
        </aside>

        <section className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-cream-200 pb-2" role="tablist" aria-label="Review sections">
            {(["overview", "images", "moderation", "history"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
                  tab === t ? "bg-green-500 text-cream-50" : "text-green-800 hover:bg-green-50",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4">
              {r.title && <h2 className="font-heading text-lg font-bold text-green-900">{r.title}</h2>}
              {r.body && <p className="text-green-800 whitespace-pre-wrap">{r.body}</p>}
              {r.pros && (
                <div>
                  <h3 className="text-sm font-bold text-green-900">Pros</h3>
                  <p className="text-sm text-green-700/80 whitespace-pre-wrap">{r.pros}</p>
                </div>
              )}
              {r.cons && (
                <div>
                  <h3 className="text-sm font-bold text-green-900">Cons</h3>
                  <p className="text-sm text-green-700/80 whitespace-pre-wrap">{r.cons}</p>
                </div>
              )}
              <dl className="grid gap-2 text-sm sm:grid-cols-2 border-t border-cream-100 pt-4">
                <div><dt className="text-green-700/60">Submitted</dt><dd>{formatDateTime(r.createdAt)}</dd></div>
                <div><dt className="text-green-700/60">Last updated</dt><dd>{formatDateTime(r.updatedAt)}</dd></div>
                {r.editedAt && <div><dt className="text-green-700/60">Edited</dt><dd>{formatDateTime(r.editedAt)}</dd></div>}
              </dl>
            </div>
          )}

          {tab === "images" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {r.images.length === 0 ? (
                <p className="text-sm text-green-700/60">No images attached.</p>
              ) : (
                r.images.map((img) => (
                  <figure key={img.id} className="rounded-2xl border border-cream-200 bg-white p-2">
                    <button type="button" onClick={() => setZoomUrl(img.url)} className="block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="Review attachment" className="aspect-square w-full object-cover" />
                    </button>
                    <figcaption className="mt-2 flex gap-2">
                      <a href={img.url} download target="_blank" rel="noreferrer" className="text-xs font-medium text-green-700 hover:underline">Download</a>
                      <button type="button" onClick={() => run(() => deleteReviewImage(img.id, r.id))} className="text-xs font-medium text-terra-600 hover:underline">Delete</button>
                    </figcaption>
                  </figure>
                ))
              )}
            </div>
          )}

          {tab === "moderation" && (
            <div className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4">
              <dl className="space-y-2 text-sm">
                <div><dt className="text-green-700/60">Moderator</dt><dd>{r.moderatorName ?? "—"}</dd></div>
                <div><dt className="text-green-700/60">Decision</dt><dd><ReviewStatusBadge status={r.status} /></dd></div>
              </dl>
              <FormField label="Reason">
                <Input value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Moderation reason" />
              </FormField>
              <FormField label="Internal notes">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} aria-label="Internal moderation notes" />
              </FormField>
              <Button onClick={saveNotes} disabled={pending} leftIcon={pending ? <Spinner size={16} /> : undefined}>Save moderation notes</Button>
            </div>
          )}

          {tab === "history" && (
            <ol className="space-y-3" aria-label="Review history timeline">
              {props.timeline.map((ev) => (
                <li key={ev.id} className="border-l-2 border-green-200 pl-4">
                  <p className="text-sm font-medium text-green-900">{ev.message}</p>
                  <p className="text-xs text-green-700/60">
                    {formatDateTime(ev.createdAt)}
                    {ev.userName ? ` · ${ev.userName}` : ""}
                    {" · "}{ev.type}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {zoomUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-green-900/70 p-4" role="dialog" aria-modal="true" aria-label="Image zoom">
          <button type="button" className="absolute inset-0" aria-label="Close zoom" onClick={() => setZoomUrl(null)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomUrl} alt="Zoomed review image" className="relative max-h-[90vh] max-w-full rounded-2xl shadow-clay" />
        </div>
      )}

      <ConfirmDialog
        open={confirmAction === "reject"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Reject this review?"
        confirmLabel="Reject"
        tone="danger"
        loading={pending}
        onConfirm={() => { run(() => rejectReview(r.id, reason || null)); setConfirmAction(null); }}
      />
      <ConfirmDialog
        open={confirmAction === "hide"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Hide this review?"
        confirmLabel="Hide"
        loading={pending}
        onConfirm={() => { run(() => hideReview(r.id, reason || null)); setConfirmAction(null); }}
      />
      <ConfirmDialog
        open={confirmAction === "delete"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Delete this review?"
        confirmLabel="Delete"
        tone="danger"
        loading={pending}
        onConfirm={() => { run(() => deleteReview(r.id)); setConfirmAction(null); }}
      />
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-4">
      <h3 className="font-heading text-sm font-bold text-green-900">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}
