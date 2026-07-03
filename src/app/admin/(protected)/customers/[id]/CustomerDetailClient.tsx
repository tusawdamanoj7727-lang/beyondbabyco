"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import CustomerStatusBadge from "@/components/admin/CustomerStatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CustomerForm from "../CustomerForm";
import {
  CUSTOMER_SEGMENT_LABELS,
  customerInitials,
  type CustomerActivityEvent,
  type CustomerAddressRow,
  type CustomerCartRow,
  type CustomerDetail,
  type CustomerLoyaltyRow,
  type CustomerOrderRow,
  type CustomerReferralRow,
  type CustomerReviewRow,
  type CustomerTicketRow,
  type CustomerWishlistRow,
} from "@/lib/admin/customer-types";
import { deactivateCustomer, deleteCustomer } from "@/lib/admin/customer-actions";
import { cn } from "@/lib/utils";

type Tab = "overview" | "orders" | "addresses" | "wishlist" | "cart" | "reviews" | "support" | "loyalty" | "referrals" | "activity" | "edit";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "orders", label: "Orders" },
  { id: "addresses", label: "Addresses" },
  { id: "wishlist", label: "Wishlist" },
  { id: "cart", label: "Cart" },
  { id: "reviews", label: "Reviews" },
  { id: "support", label: "Support" },
  { id: "loyalty", label: "Loyalty" },
  { id: "referrals", label: "Referrals" },
  { id: "activity", label: "Activity" },
  { id: "edit", label: "Edit" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatMoney(n: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export default function CustomerDetailClient(props: {
  customer: CustomerDetail;
  orders: CustomerOrderRow[];
  addresses: CustomerAddressRow[];
  wishlist: CustomerWishlistRow[];
  cart: { items: CustomerCartRow[]; updatedAt: string | null; abandoned: boolean };
  reviews: CustomerReviewRow[];
  tickets: CustomerTicketRow[];
  loyalty: { balance: number; history: CustomerLoyaltyRow[] };
  referrals: CustomerReferralRow[];
  activity: CustomerActivityEvent[];
  initialTab?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>((props.initialTab as Tab) || "overview");
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const c = props.customer;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-cream-200 bg-cream-50 p-4">
        <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-green-100 text-lg font-bold text-green-800 ring-2 ring-green-200">
          {c.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            customerInitials(c.fullName)
          )}
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl font-bold text-green-900">{c.fullName}</h2>
            <CustomerStatusBadge status={c.status} size="md" />
            <Badge variant="default" size="sm">{CUSTOMER_SEGMENT_LABELS[c.segment]}</Badge>
            {c.isVip && <Badge variant="info" size="sm">VIP</Badge>}
            {c.isNewsletter && <Badge variant="success" size="sm">Newsletter</Badge>}
          </div>
          <p className="text-sm text-green-700/70">Member since {formatDate(c.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => setTab("edit")}>Edit</Button>
          <Button variant="ghost" size="sm" onClick={() => setDeactivateOpen(true)} disabled={c.status === "inactive"}>Deactivate</Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-cream-200 pb-2" role="tablist" aria-label="Customer profile sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
              tab === t.id ? "bg-green-500 text-cream-50" : "text-green-800 hover:bg-green-50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
            <StatCard label="Total orders" value={String(c.orderCount)} />
            <StatCard label="Lifetime value" value={formatMoney(c.lifetimeValue)} />
            <StatCard label="Average order value" value={formatMoney(c.averageOrderValue)} />
            <StatCard label="Last purchase" value={c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"} />
          </section>
          <aside className="space-y-4">
            <Panel title="Contact">
              <p className="text-sm text-green-800">{c.email ?? "—"}</p>
              <p className="text-sm text-green-700/70">{c.phone ?? "—"}</p>
            </Panel>
            {c.tags.length > 0 && (
              <Panel title="Tags">
                <div className="flex flex-wrap gap-1">
                  {c.tags.map((t) => <Badge key={t} variant="default" size="sm">{t}</Badge>)}
                </div>
              </Panel>
            )}
            {c.notes && (
              <Panel title="Notes">
                <p className="text-sm text-green-800 whitespace-pre-wrap">{c.notes}</p>
              </Panel>
            )}
            {c.internalNotes && (
              <Panel title="Internal comments">
                <p className="text-sm text-green-700/70 whitespace-pre-wrap">{c.internalNotes}</p>
              </Panel>
            )}
          </aside>
        </div>
      )}

      {tab === "orders" && (
        <div className="rounded-3xl border border-cream-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-200 text-left text-green-700/70">
                <th className="p-4">Order</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4">Date</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {props.orders.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-green-700/60">No orders yet.</td></tr>
              ) : (
                props.orders.map((o) => (
                  <tr key={o.id} className="border-b border-cream-100">
                    <td className="p-4 font-medium text-green-900">{o.orderNumber}</td>
                    <td className="p-4 capitalize">{o.status.replace(/_/g, " ")}</td>
                    <td className="p-4 text-right">{formatMoney(o.grandTotal, o.currency)}</td>
                    <td className="p-4">{formatDate(o.createdAt)}</td>
                    <td className="p-4">
                      <Link href={`/admin/orders/${o.id}`} className="text-green-700 hover:underline">View</Link>
                      {" · "}
                      <a href={`/admin/orders/${o.id}/documents/invoice`} target="_blank" rel="noreferrer" className="text-green-700/70 hover:underline">Invoice</a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "addresses" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {props.addresses.length === 0 ? (
            <p className="text-sm text-green-700/60">No saved addresses.</p>
          ) : (
            props.addresses.map((a) => (
              <div key={a.id} className="rounded-3xl border border-cream-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <Badge variant="default" size="sm" className="capitalize">{a.type}</Badge>
                  {a.isDefault && <Badge variant="success" size="sm">Default</Badge>}
                </div>
                <p className="mt-3 font-medium text-green-900">{a.fullName ?? c.fullName}</p>
                <p className="text-sm text-green-800">{a.line1}</p>
                {a.line2 && <p className="text-sm text-green-800">{a.line2}</p>}
                <p className="text-sm text-green-700/70">{a.city}, {a.state} {a.pincode}</p>
                <p className="text-sm text-green-700/70">{a.country}</p>
                <div className="mt-4 rounded-2xl bg-cream-100 p-6 text-center text-xs text-green-700/50" aria-label="Map placeholder">
                  Map preview placeholder
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "wishlist" && (
        <ul className="space-y-2">
          {props.wishlist.length === 0 ? (
            <li className="text-sm text-green-700/60">Wishlist is empty.</li>
          ) : (
            props.wishlist.map((w) => (
              <li key={w.id} className="flex items-center justify-between rounded-2xl border border-cream-200 bg-white px-4 py-3">
                <span className="font-medium text-green-900">{w.productName}</span>
                <Badge variant={w.inStock ? "success" : "warning"} size="sm">{w.inStock ? "In stock" : "Out of stock"}</Badge>
              </li>
            ))
          )}
        </ul>
      )}

      {tab === "cart" && (
        <div className="space-y-4">
          {props.cart.abandoned && (
            <div role="status" className="rounded-2xl border border-terra-200 bg-terra-50 px-4 py-3 text-sm text-terra-800">
              Abandoned cart — last updated {props.cart.updatedAt ? formatDateTime(props.cart.updatedAt) : "—"}. Recovery email placeholder.
            </div>
          )}
          {props.cart.items.length === 0 ? (
            <p className="text-sm text-green-700/60">Cart is empty.</p>
          ) : (
            <div className="rounded-3xl border border-cream-200 bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-200 text-left text-green-700/70">
                    <th className="p-4">Product</th>
                    <th className="p-4">Variant</th>
                    <th className="p-4 text-right">Qty</th>
                    <th className="p-4 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {props.cart.items.map((item) => (
                    <tr key={item.variantId} className="border-b border-cream-100">
                      <td className="p-4">{item.productName}</td>
                      <td className="p-4">{item.variantName}</td>
                      <td className="p-4 text-right">{item.quantity}</td>
                      <td className="p-4 text-right">{formatMoney(item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "reviews" && (
        <ul className="space-y-3">
          {props.reviews.length === 0 ? (
            <li className="text-sm text-green-700/60">No reviews.</li>
          ) : (
            props.reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-cream-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-900">{r.productName}</span>
                  <Badge variant={r.isPublished ? "success" : "warning"} size="sm">{r.isPublished ? "Published" : "Pending"}</Badge>
                </div>
                <p className="mt-1 text-sm text-terra-600">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                {r.title && <p className="font-medium text-green-800">{r.title}</p>}
                {r.body && <p className="text-sm text-green-700/70">{r.body}</p>}
              </li>
            ))
          )}
        </ul>
      )}

      {tab === "support" && (
        <div className="rounded-3xl border border-cream-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-200 text-left text-green-700/70">
                <th className="p-4">Ticket</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Status</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {props.tickets.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-green-700/60">No support tickets.</td></tr>
              ) : (
                props.tickets.map((t) => (
                  <tr key={t.id} className="border-b border-cream-100">
                    <td className="p-4 font-medium">{t.ticketNumber}</td>
                    <td className="p-4">{t.subject}</td>
                    <td className="p-4 capitalize">{t.status}</td>
                    <td className="p-4 capitalize">{t.priority}</td>
                    <td className="p-4">{t.assignedName ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "loyalty" && (
        <div className="space-y-4">
          <StatCard label="Points balance" value={String(props.loyalty.balance)} />
          <ul className="space-y-2">
            {props.loyalty.history.length === 0 ? (
              <li className="text-sm text-green-700/60">No loyalty history.</li>
            ) : (
              props.loyalty.history.map((h) => (
                <li key={h.id} className="flex justify-between rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm">
                  <span>{h.reason ?? "Points adjustment"}</span>
                  <span className={cn("font-medium", h.points >= 0 ? "text-green-800" : "text-terra-600")}>
                    {h.points >= 0 ? "+" : ""}{h.points}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {tab === "referrals" && (
        <ul className="space-y-2">
          {props.referrals.length === 0 ? (
            <li className="text-sm text-green-700/60">No referrals.</li>
          ) : (
            props.referrals.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm">
                <span>{r.referredName ?? r.referredEmail ?? "Pending invite"}</span>
                <span className="text-green-700/70 capitalize">{r.status} · {r.rewardPoints} pts</span>
              </li>
            ))
          )}
        </ul>
      )}

      {tab === "activity" && (
        <ol className="space-y-3" aria-label="Customer activity timeline">
          {props.activity.length === 0 ? (
            <li className="text-sm text-green-700/60">No activity recorded.</li>
          ) : (
            props.activity.map((ev) => (
              <li key={ev.id} className="border-l-2 border-green-200 pl-4">
                <p className="text-sm font-medium text-green-900">{ev.message}</p>
                <p className="text-xs text-green-700/60">
                  {formatDateTime(ev.createdAt)}
                  {ev.userName ? ` · ${ev.userName}` : ""}
                  {" · "}{ev.type}
                </p>
              </li>
            ))
          )}
        </ol>
      )}

      {tab === "edit" && <CustomerForm mode="edit" customer={c} />}

      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate customer?"
        confirmLabel="Deactivate"
        tone="danger"
        loading={pending}
        onConfirm={() => {
          startTransition(async () => {
            await deactivateCustomer(c.id);
            setDeactivateOpen(false);
            router.refresh();
          });
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete customer?"
        description="This soft-deletes the customer record."
        confirmLabel="Delete"
        tone="danger"
        loading={pending}
        onConfirm={() => {
          startTransition(async () => {
            await deleteCustomer(c.id);
            setDeleteOpen(false);
            router.push("/admin/customers");
          });
        }}
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-green-700/60">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-green-900">{value}</p>
    </div>
  );
}
