"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import DeleteDialog from "@/components/admin/DeleteDialog";
import { CampaignStatusBadge } from "@/components/admin/marketing/MarketingStatusBadge";
import FormField, { Input, Select, Textarea, fieldControlClasses } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import {
  CAMPAIGN_TYPES,
  CAMPAIGN_TYPE_LABELS,
  formatDateTime,
  formatMoney,
  formatPercent,
  type CampaignListItem,
  type CampaignStatus,
  type CampaignType,
} from "@/lib/admin/marketing-types";
import {
  createCampaign,
  deleteCampaign,
  exportMarketingReport,
  pauseCampaign,
  resumeCampaign,
  scheduleCampaign,
  sendCampaign,
  sendTestCampaign,
  updateCampaign,
} from "@/lib/admin/marketing-actions";

export default function CampaignsClient(props: {
  rows: CampaignListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  segments: { id: string; name: string }[];
  templates: { id: string; name: string; channel: string }[];
  filters: { search: string; type: CampaignType | "all"; status: CampaignStatus | "all" };
  basePath: string;
  title: string;
  fixedType?: CampaignType;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<CampaignListItem | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [form, setForm] = useState({
    name: "",
    campaign_type: (props.fixedType ?? "email") as CampaignType,
    template_id: "",
    segment_id: "",
    subject: "",
    preview_text: "",
    sender_name: "",
    reply_to: "",
    title: "",
    message: "",
    image_url: "",
    deep_link: "",
    scheduled_at: "",
  });

  function push(patch: Record<string, string | null>) {
    const sp = new URLSearchParams();
    const base = { ...props.filters, page: String(props.page) };
    const merged = { ...base, ...patch };
    if (!("page" in patch)) merged.page = "1";
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") sp.set(k, v);
    }
    router.push(`${props.basePath}?${sp.toString()}`);
  }

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      setEditing(null);
      router.refresh();
    });
  }

  function resetForm() {
    setForm({
      name: "",
      campaign_type: props.fixedType ?? "email",
      template_id: "",
      segment_id: "",
      subject: "",
      preview_text: "",
      sender_name: "",
      reply_to: "",
      title: "",
      message: "",
      image_url: "",
      deep_link: "",
      scheduled_at: "",
    });
    setEditing(null);
  }

  const channelTemplates = props.templates.filter((t) => !props.fixedType || t.channel === props.fixedType);

  const columns: Column<CampaignListItem>[] = [
    { key: "name", header: "Name", render: (r) => r.name },
    ...(!props.fixedType ? [{ key: "type", header: "Type", render: (r: CampaignListItem) => CAMPAIGN_TYPE_LABELS[r.campaignType] }] : []),
    { key: "status", header: "Status", render: (r) => <CampaignStatusBadge status={r.status} /> },
    { key: "segment", header: "Audience", render: (r) => r.segmentName ?? "—" },
    { key: "scheduled", header: "Scheduled", render: (r) => formatDateTime(r.scheduledAt) },
    { key: "sent", header: "Sent", render: (r) => String(r.sentCount) },
    { key: "open", header: "Open %", render: (r) => formatPercent(r.sentCount ? r.openedCount / r.sentCount : 0) },
    { key: "revenue", header: "Revenue", render: (r) => formatMoney(r.revenue) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          <ActionBtn label="Edit" onClick={() => loadEdit(r)} />
          {r.status === "draft" && <ActionBtn label="Schedule" onClick={() => { const at = prompt("Schedule (ISO datetime)", new Date().toISOString()); if (at) run(() => scheduleCampaign(r.id, { scheduled_at: at })); }} />}
          {(r.status === "draft" || r.status === "scheduled") && <ActionBtn label="Send" onClick={() => run(() => sendCampaign(r.id))} />}
          {r.status === "running" && <ActionBtn label="Pause" onClick={() => run(() => pauseCampaign(r.id))} />}
          {r.status === "paused" && <ActionBtn label="Resume" onClick={() => run(() => resumeCampaign(r.id))} />}
          <ActionBtn label="Delete" danger onClick={() => setDeleteId(r.id)} />
        </div>
      ),
    },
  ];

  function loadEdit(r: CampaignListItem) {
    setEditing(r);
    setForm({
      name: r.name,
      campaign_type: r.campaignType,
      template_id: "",
      segment_id: "",
      subject: "",
      preview_text: "",
      sender_name: "",
      reply_to: "",
      title: "",
      message: "",
      image_url: "",
      deep_link: "",
      scheduled_at: r.scheduledAt?.slice(0, 16) ?? "",
    });
  }

  function payload() {
    return {
      name: form.name,
      campaign_type: form.campaign_type,
      template_id: form.template_id || null,
      segment_id: form.segment_id || null,
      subject: form.subject || null,
      preview_text: form.preview_text || null,
      sender_name: form.sender_name || null,
      reply_to: form.reply_to || null,
      title: form.title || null,
      message: form.message || null,
      image_url: form.image_url || null,
      deep_link: form.deep_link || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-green-900">{props.title}</h2>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(async () => {
          const res = await exportMarketingReport({
            format: "csv",
            report_type: "campaigns",
            rows: props.rows.map((r) => ({ name: r.name, type: r.campaignType, status: r.status, sent: r.sentCount, revenue: r.revenue })),
            columns: [{ key: "name", header: "Name" }, { key: "type", header: "Type" }, { key: "status", header: "Status" }, { key: "sent", header: "Sent" }, { key: "revenue", header: "Revenue" }],
          });
          if (res.content && res.fileName) download(res.content, res.fileName, "text/csv");
          return { ok: res.ok, error: res.error };
        })}>Export CSV</Button>
      </div>

      <div className="flex flex-wrap gap-3" role="search" aria-label="Campaign filters">
        <input type="search" defaultValue={props.filters.search} onChange={(e) => push({ search: e.target.value || null })} placeholder="Search…" aria-label="Search campaigns" className={fieldControlClasses + " min-w-[180px] flex-1"} />
        {!props.fixedType && (
          <Select aria-label="Campaign type" value={props.filters.type} onChange={(e) => push({ type: e.target.value })} className="w-40">
            <option value="all">All types</option>
            {CAMPAIGN_TYPES.map((t) => <option key={t} value={t}>{CAMPAIGN_TYPE_LABELS[t]}</option>)}
          </Select>
        )}
        <Select aria-label="Status" value={props.filters.status} onChange={(e) => push({ status: e.target.value })} className="w-36">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="running">Running</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </Select>
      </div>

      <form className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4" onSubmit={(e) => {
        e.preventDefault();
        if (editing) run(() => updateCampaign(editing.id, payload()));
        else run(() => createCampaign(payload()));
      }}>
        <h3 className="font-heading text-sm font-bold text-green-900">{editing ? "Edit campaign" : "Create campaign"}</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Campaign name" /></FormField>
          {!props.fixedType && (
            <FormField label="Type"><Select value={form.campaign_type} onChange={(e) => setForm({ ...form, campaign_type: e.target.value as CampaignType })} aria-label="Campaign type">{CAMPAIGN_TYPES.map((t) => <option key={t} value={t}>{CAMPAIGN_TYPE_LABELS[t]}</option>)}</Select></FormField>
          )}
          <FormField label="Template"><Select value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })} aria-label="Template"><option value="">None</option>{channelTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></FormField>
          <FormField label="Audience"><Select value={form.segment_id} onChange={(e) => setForm({ ...form, segment_id: e.target.value })} aria-label="Audience segment"><option value="">All</option>{props.segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormField>
          {(form.campaign_type === "email" || props.fixedType === "email") && (
            <>
              <FormField label="Subject"><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} aria-label="Email subject" /></FormField>
              <FormField label="Preview text"><Input value={form.preview_text} onChange={(e) => setForm({ ...form, preview_text: e.target.value })} aria-label="Preview text" /></FormField>
              <FormField label="Sender name"><Input value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} aria-label="Sender name" /></FormField>
              <FormField label="Reply-to"><Input type="email" value={form.reply_to} onChange={(e) => setForm({ ...form, reply_to: e.target.value })} aria-label="Reply-to email" /></FormField>
            </>
          )}
          {(form.campaign_type === "push" || props.fixedType === "push") && (
            <>
              <FormField label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-label="Push title" /></FormField>
              <FormField label="Deep link"><Input value={form.deep_link} onChange={(e) => setForm({ ...form, deep_link: e.target.value })} aria-label="Deep link" /></FormField>
              <FormField label="Image URL"><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} aria-label="Image URL" /></FormField>
            </>
          )}
          <FormField label="Message" className="md:col-span-2 lg:col-span-3"><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} aria-label="Message" /></FormField>
          <FormField label="Schedule"><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} aria-label="Schedule" /></FormField>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>{editing ? "Save" : "Create"}</Button>
          {editing && <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>}
          <Input type="email" placeholder="Test email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="max-w-xs" aria-label="Test email address" />
          <Button type="button" variant="ghost" disabled={pending || !editing} onClick={() => editing && testEmail && run(() => sendTestCampaign({ campaign_id: editing.id, test_email: testEmail }))}>Send test</Button>
        </div>
      </form>

      <DataTable columns={columns} rows={props.rows} getRowId={(r) => r.id} empty="No campaigns yet." />
      <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) })} />

      <DeleteDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} loading={pending} onConfirm={() => { if (deleteId) run(() => deleteCampaign(deleteId)); setDeleteId(null); }} />
    </div>
  );
}

function ActionBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-lg px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 ${danger ? "text-terra-600 hover:bg-terra-50" : "text-green-700 hover:bg-green-50"}`}>
      {label}
    </button>
  );
}

function download(content: string, fileName: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
