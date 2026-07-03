"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import DeleteDialog from "@/components/admin/DeleteDialog";
import FormField, { Input, Select, Textarea, fieldControlClasses } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import Card from "@/components/ui/Card";
import {
  SEGMENT_PRESET_LABELS,
  SEGMENT_PRESETS,
  TEMPLATE_CHANNEL_LABELS,
  TEMPLATE_CHANNELS,
  type MarketingListResult,
  type SegmentListItem,
  type TemplateChannel,
  type TemplateListItem,
} from "@/lib/admin/marketing-types";
import {
  archiveTemplate,
  createSegment,
  createTemplate,
  deleteSegment,
  deleteTemplate,
  duplicateTemplate,
  exportMarketingReport,
  refreshSegmentCount,
  updateSegment,
  updateTemplate,
} from "@/lib/admin/marketing-actions";

export default function SegmentsClient(props: {
  segments: MarketingListResult<SegmentListItem>;
  templates: MarketingListResult<TemplateListItem>;
  search: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [deleteSegId, setDeleteSegId] = useState<string | null>(null);
  const [deleteTplId, setDeleteTplId] = useState<string | null>(null);
  const [editingSeg, setEditingSeg] = useState<SegmentListItem | null>(null);
  const [editingTpl, setEditingTpl] = useState<TemplateListItem | null>(null);
  const [segForm, setSegForm] = useState({ name: "", slug: "", description: "", preset: "first_time_buyers", is_active: true });
  const [tplForm, setTplForm] = useState({
    name: "",
    channel: "email" as TemplateChannel,
    subject: "",
    preview_text: "",
    body_html: "",
    title: "",
    message: "",
    variables: "",
    status: "active" as "active" | "archived",
  });

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      setEditingSeg(null);
      setEditingTpl(null);
      router.refresh();
    });
  }

  function pushSearch(search: string) {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    router.push(`/admin/marketing/segments?${sp.toString()}`);
  }

  const segColumns: Column<SegmentListItem>[] = [
    { key: "name", header: "Segment", render: (r) => r.name },
    { key: "type", header: "Type", render: (r) => r.segmentType },
    { key: "count", header: "Customers", render: (r) => String(r.customerCount) },
    { key: "active", header: "Active", render: (r) => (r.isActive ? "Yes" : "No") },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => { setEditingSeg(r); setSegForm({ name: r.name, slug: r.slug, description: "", preset: (r.criteria.preset as string) ?? "first_time_buyers", is_active: r.isActive }); }} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Edit</button>
          <button type="button" onClick={() => run(() => refreshSegmentCount(r.id))} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Refresh</button>
          <button type="button" onClick={() => setDeleteSegId(r.id)} className="rounded-lg px-2 py-1 text-sm text-terra-600 hover:bg-terra-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Delete</button>
        </div>
      ),
    },
  ];

  const tplColumns: Column<TemplateListItem>[] = [
    { key: "name", header: "Template", render: (r) => r.name },
    { key: "channel", header: "Channel", render: (r) => TEMPLATE_CHANNEL_LABELS[r.channel] },
    { key: "subject", header: "Subject / Title", render: (r) => r.subject ?? r.title ?? "—" },
    { key: "status", header: "Status", render: (r) => r.status },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => { setEditingTpl(r); setTplForm({ name: r.name, channel: r.channel, subject: r.subject ?? "", preview_text: "", body_html: "", title: r.title ?? "", message: "", variables: r.variables.join(", "), status: r.status }); }} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50">Edit</button>
          <button type="button" onClick={() => run(() => duplicateTemplate(r.id))} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50">Duplicate</button>
          {r.status === "active" && <button type="button" onClick={() => run(() => archiveTemplate(r.id))} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50">Archive</button>}
          <button type="button" onClick={() => setDeleteTplId(r.id)} className="rounded-lg px-2 py-1 text-sm text-terra-600 hover:bg-terra-50">Delete</button>
        </div>
      ),
    },
  ];

  function pushPage(page: number) {
    const sp = new URLSearchParams();
    if (props.search) sp.set("search", props.search);
    if (page > 1) sp.set("page", String(page));
    router.push(`/admin/marketing/segments?${sp.toString()}`);
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="segments-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="segments-heading" className="font-heading text-lg font-bold text-green-900">Customer Segments</h2>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(async () => {
            const res = await exportMarketingReport({ format: "csv", report_type: "segments", rows: props.segments.rows.map((r) => ({ name: r.name, count: r.customerCount, type: r.segmentType })) });
            if (res.content && res.fileName) download(res.content, res.fileName);
            return { ok: res.ok, error: res.error };
          })}>Export CSV</Button>
        </div>

        <input type="search" defaultValue={props.search} onChange={(e) => pushSearch(e.target.value)} placeholder="Search segments…" aria-label="Search segments" className={fieldControlClasses + " mt-4 max-w-md"} />

        <form className="mt-4 rounded-3xl border border-cream-200 bg-white p-5 space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const criteria = { preset: segForm.preset };
          const payload = { name: segForm.name, slug: segForm.slug || segForm.name.toLowerCase().replace(/\s+/g, "-"), description: segForm.description || null, segment_type: "custom" as const, criteria, is_active: segForm.is_active };
          if (editingSeg) run(() => updateSegment(editingSeg.id, payload));
          else run(() => createSegment(payload));
        }}>
          <h3 className="font-heading text-sm font-bold text-green-900">{editingSeg ? "Edit segment" : "Create segment"}</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormField label="Name"><Input required value={segForm.name} onChange={(e) => setSegForm({ ...segForm, name: e.target.value })} aria-label="Segment name" /></FormField>
            <FormField label="Slug"><Input required value={segForm.slug} onChange={(e) => setSegForm({ ...segForm, slug: e.target.value })} aria-label="Segment slug" /></FormField>
            <FormField label="Preset criteria"><Select value={segForm.preset} onChange={(e) => setSegForm({ ...segForm, preset: e.target.value })} aria-label="Preset">{SEGMENT_PRESETS.map((p) => <option key={p} value={p}>{SEGMENT_PRESET_LABELS[p]}</option>)}</Select></FormField>
            <FormField label="Description" className="md:col-span-2"><Textarea value={segForm.description} onChange={(e) => setSegForm({ ...segForm, description: e.target.value })} rows={2} aria-label="Description" /></FormField>
          </div>
          <Button type="submit" disabled={pending}>{editingSeg ? "Save" : "Create"}</Button>
        </form>

        <div className="mt-4">
          <DataTable columns={segColumns} rows={props.segments.rows} getRowId={(r) => r.id} empty="No segments defined." />
          <Pagination page={props.segments.page} pageCount={props.segments.pageCount} total={props.segments.total} perPage={props.segments.perPage} onPageChange={pushPage} />
        </div>
      </section>

      <section aria-labelledby="templates-heading">
        <h2 id="templates-heading" className="font-heading text-lg font-bold text-green-900">Templates</h2>
        <p className="mt-1 text-sm text-green-700/60">Email, WhatsApp and Push templates with variable support.</p>

        <form className="mt-4 rounded-3xl border border-cream-200 bg-white p-5 space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const payload = {
            name: tplForm.name,
            channel: tplForm.channel,
            subject: tplForm.subject || null,
            preview_text: tplForm.preview_text || null,
            body_html: tplForm.body_html || null,
            title: tplForm.title || null,
            message: tplForm.message || null,
            variables: tplForm.variables.split(",").map((v) => v.trim()).filter(Boolean),
            status: tplForm.status,
          };
          if (editingTpl) run(() => updateTemplate(editingTpl.id, payload));
          else run(() => createTemplate(payload));
        }}>
          <h3 className="font-heading text-sm font-bold text-green-900">{editingTpl ? "Edit template" : "Create template"}</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormField label="Name"><Input required value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} aria-label="Template name" /></FormField>
            <FormField label="Channel"><Select value={tplForm.channel} onChange={(e) => setTplForm({ ...tplForm, channel: e.target.value as TemplateChannel })} aria-label="Channel">{TEMPLATE_CHANNELS.map((c) => <option key={c} value={c}>{TEMPLATE_CHANNEL_LABELS[c]}</option>)}</Select></FormField>
            <FormField label="Variables (comma-separated)"><Input value={tplForm.variables} onChange={(e) => setTplForm({ ...tplForm, variables: e.target.value })} placeholder="{{name}}, {{order_id}}" aria-label="Variables" /></FormField>
            {tplForm.channel === "email" && (
              <>
                <FormField label="Subject"><Input value={tplForm.subject} onChange={(e) => setTplForm({ ...tplForm, subject: e.target.value })} aria-label="Subject" /></FormField>
                <FormField label="Preview text"><Input value={tplForm.preview_text} onChange={(e) => setTplForm({ ...tplForm, preview_text: e.target.value })} aria-label="Preview text" /></FormField>
                <FormField label="Body HTML" className="md:col-span-2 lg:col-span-3"><Textarea value={tplForm.body_html} onChange={(e) => setTplForm({ ...tplForm, body_html: e.target.value })} rows={4} aria-label="Body HTML" /></FormField>
              </>
            )}
            {(tplForm.channel === "whatsapp" || tplForm.channel === "push") && (
              <FormField label="Message" className="md:col-span-2 lg:col-span-3"><Textarea value={tplForm.message} onChange={(e) => setTplForm({ ...tplForm, message: e.target.value })} rows={3} aria-label="Message" /></FormField>
            )}
            {tplForm.channel === "push" && (
              <FormField label="Title"><Input value={tplForm.title} onChange={(e) => setTplForm({ ...tplForm, title: e.target.value })} aria-label="Push title" /></FormField>
            )}
          </div>
          <Card padding="sm" radius="3xl" variant="outline" className="text-xs text-green-700/60">Preview: variables like {"{{name}}"} will be replaced at send time.</Card>
          <Button type="submit" disabled={pending}>{editingTpl ? "Save" : "Create"}</Button>
        </form>

        <div className="mt-4">
          <DataTable columns={tplColumns} rows={props.templates.rows} getRowId={(r) => r.id} empty="No templates yet." />
        </div>
      </section>

      <DeleteDialog open={!!deleteSegId} onOpenChange={(o) => !o && setDeleteSegId(null)} loading={pending} onConfirm={() => { if (deleteSegId) run(() => deleteSegment(deleteSegId)); setDeleteSegId(null); }} />
      <DeleteDialog open={!!deleteTplId} onOpenChange={(o) => !o && setDeleteTplId(null)} loading={pending} onConfirm={() => { if (deleteTplId) run(() => deleteTemplate(deleteTplId)); setDeleteTplId(null); }} />
    </div>
  );
}

function download(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
