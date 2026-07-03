"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import type { Json } from "@/lib/supabase/database.types";
import {
  campaignInputSchema,
  marketingExportSchema,
  scheduleCampaignSchema,
  segmentInputSchema,
  sendTestSchema,
  templateInputSchema,
} from "./marketing-schema";
import { estimateSegmentCount } from "./marketing";

export interface MarketingActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
  content?: string;
  fileName?: string;
}

async function guardManage() {
  await requirePermission(PERMISSIONS.MARKETING_MANAGE);
}

async function guardSend() {
  await requirePermission(PERMISSIONS.MARKETING_SEND);
}

async function guardView() {
  await requirePermission(PERMISSIONS.MARKETING_VIEW);
}

function revalidateAll() {
  const paths = [
    "/admin/marketing",
    "/admin/marketing/campaigns",
    "/admin/marketing/campaigns/calendar",
    "/admin/marketing/campaigns/creative",
    "/admin/marketing/email",
    "/admin/marketing/whatsapp",
    "/admin/marketing/push",
    "/admin/marketing/segments",
    "/admin/marketing/loyalty",
    "/admin/marketing/automation",
  ];
  for (const p of paths) revalidatePath(p);
}

async function audit(table: string, record: string, action: string, payload?: Record<string, unknown>) {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("log_audit", {
    p_table: table,
    p_record: record,
    p_action: action,
    p_new: (payload ?? {}) as Json,
  });
}

// --------------------------- Campaigns ---------------------------

export async function createCampaign(input: Parameters<typeof campaignInputSchema.parse>[0]): Promise<MarketingActionResult> {
  await guardManage();
  const parsed = campaignInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid campaign." };

  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .insert({
      name: parsed.data.name,
      campaign_type: parsed.data.campaign_type,
      template_id: parsed.data.template_id ?? null,
      segment_id: parsed.data.segment_id ?? null,
      subject: parsed.data.subject ?? null,
      preview_text: parsed.data.preview_text ?? null,
      sender_name: parsed.data.sender_name ?? null,
      reply_to: parsed.data.reply_to ?? null,
      title: parsed.data.title ?? null,
      message: parsed.data.message ?? null,
      image_url: parsed.data.image_url ?? null,
      deep_link: parsed.data.deep_link ?? null,
      media_url: parsed.data.media_url ?? null,
      buttons: (parsed.data.buttons ?? []) as Json,
      scheduled_at: parsed.data.scheduled_at ?? null,
      status: parsed.data.scheduled_at ? "scheduled" : "draft",
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  await audit("marketing_campaigns", data.id, "create");
  revalidateAll();
  return { ok: true, error: null, id: data.id };
}

export async function updateCampaign(id: string, input: Parameters<typeof campaignInputSchema.parse>[0]): Promise<MarketingActionResult> {
  await guardManage();
  const parsed = campaignInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid campaign." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("marketing_campaigns")
    .update({
      name: parsed.data.name,
      template_id: parsed.data.template_id ?? null,
      segment_id: parsed.data.segment_id ?? null,
      subject: parsed.data.subject ?? null,
      preview_text: parsed.data.preview_text ?? null,
      sender_name: parsed.data.sender_name ?? null,
      reply_to: parsed.data.reply_to ?? null,
      title: parsed.data.title ?? null,
      message: parsed.data.message ?? null,
      image_url: parsed.data.image_url ?? null,
      deep_link: parsed.data.deep_link ?? null,
      media_url: parsed.data.media_url ?? null,
      buttons: (parsed.data.buttons ?? []) as Json,
      scheduled_at: parsed.data.scheduled_at ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  await audit("marketing_campaigns", id, "update");
  revalidateAll();
  return { ok: true, error: null, id };
}

export async function deleteCampaign(id: string): Promise<MarketingActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("marketing_campaigns").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("marketing_campaigns", id, "delete");
  revalidateAll();
  return { ok: true, error: null };
}

export async function scheduleCampaign(id: string, input: { scheduled_at: string }): Promise<MarketingActionResult> {
  await guardSend();
  const parsed = scheduleCampaignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid schedule." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("marketing_campaigns")
    .update({ scheduled_at: parsed.data.scheduled_at, status: "scheduled", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  await audit("marketing_campaigns", id, "schedule");
  revalidateAll();
  return { ok: true, error: null };
}

export async function sendCampaign(id: string): Promise<MarketingActionResult> {
  await guardSend();
  const supabase = await createSupabaseServerClient();

  const { data: campaign, error: fetchErr } = await supabase
    .from("marketing_campaigns")
    .select("id, campaign_type, subject, message, title")
    .eq("id", id)
    .single();

  if (fetchErr || !campaign) return { ok: false, error: fetchErr?.message ?? "Campaign not found." };

  // Placeholder delivery — queue entries without external API
  const now = new Date().toISOString();
  await supabase.from("marketing_campaigns").update({ status: "running", started_at: now, updated_at: now }).eq("id", id);

  if (campaign.campaign_type === "email") {
    await supabase.from("email_queue").insert({
      campaign_id: id,
      to_email: "test@placeholder.local",
      subject: campaign.subject ?? "Campaign",
      body_html: campaign.message ?? "<p>Campaign content</p>",
      status: "queued",
      scheduled_at: now,
    });
  } else if (campaign.campaign_type === "whatsapp") {
    await supabase.from("whatsapp_queue").insert({
      campaign_id: id,
      to_phone: "+910000000000",
      body: campaign.message ?? "Campaign message",
      status: "queued",
      scheduled_at: now,
    });
  } else if (campaign.campaign_type === "push") {
    await supabase.from("push_queue").insert({
      campaign_id: id,
      title: campaign.title ?? "Notification",
      message: campaign.message ?? "Campaign message",
      status: "queued",
      scheduled_at: now,
    });
  }

  await audit("marketing_campaigns", id, "send");
  revalidateAll();
  return { ok: true, error: null };
}

export async function pauseCampaign(id: string): Promise<MarketingActionResult> {
  await guardSend();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("marketing_campaigns").update({ status: "paused", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("marketing_campaigns", id, "pause");
  revalidateAll();
  return { ok: true, error: null };
}

export async function resumeCampaign(id: string): Promise<MarketingActionResult> {
  await guardSend();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("marketing_campaigns").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("marketing_campaigns", id, "resume");
  revalidateAll();
  return { ok: true, error: null };
}

export async function sendTestCampaign(input: Parameters<typeof sendTestSchema.parse>[0]): Promise<MarketingActionResult> {
  await guardSend();
  const parsed = sendTestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid test send." };

  const supabase = await createSupabaseServerClient();
  const { data: campaign } = await supabase.from("marketing_campaigns").select("subject, message, title, campaign_type").eq("id", parsed.data.campaign_id).single();
  if (!campaign) return { ok: false, error: "Campaign not found." };

  // TODO: Brevo / Mailchimp / SendGrid / Meta WhatsApp / FCM / OneSignal
  await audit("marketing_campaigns", parsed.data.campaign_id, "send_test", { test_email: parsed.data.test_email, test_phone: parsed.data.test_phone });
  revalidateAll();
  return { ok: true, error: null };
}

// --------------------------- Segments ---------------------------

export async function createSegment(input: Parameters<typeof segmentInputSchema.parse>[0]): Promise<MarketingActionResult> {
  await guardManage();
  const parsed = segmentInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid segment." };

  const count = await estimateSegmentCount(parsed.data.criteria);
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("marketing_segments")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      segment_type: parsed.data.segment_type,
      criteria: parsed.data.criteria as Json,
      customer_count: count,
      is_active: parsed.data.is_active,
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  await audit("marketing_segments", data.id, "create");
  revalidateAll();
  return { ok: true, error: null, id: data.id };
}

export async function updateSegment(id: string, input: Parameters<typeof segmentInputSchema.parse>[0]): Promise<MarketingActionResult> {
  await guardManage();
  const parsed = segmentInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid segment." };

  const count = await estimateSegmentCount(parsed.data.criteria);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("marketing_segments")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      criteria: parsed.data.criteria as Json,
      customer_count: count,
      is_active: parsed.data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  await audit("marketing_segments", id, "update");
  revalidateAll();
  return { ok: true, error: null, id };
}

export async function deleteSegment(id: string): Promise<MarketingActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("marketing_segments").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("marketing_segments", id, "delete");
  revalidateAll();
  return { ok: true, error: null };
}

export async function refreshSegmentCount(id: string): Promise<MarketingActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { data: seg } = await supabase.from("marketing_segments").select("criteria").eq("id", id).single();
  if (!seg) return { ok: false, error: "Segment not found." };

  const count = await estimateSegmentCount((seg.criteria ?? {}) as Record<string, unknown>);
  await supabase.from("marketing_segments").update({ customer_count: count, updated_at: new Date().toISOString() }).eq("id", id);
  revalidateAll();
  return { ok: true, error: null };
}

// --------------------------- Templates ---------------------------

export async function createTemplate(input: Parameters<typeof templateInputSchema.parse>[0]): Promise<MarketingActionResult> {
  await guardManage();
  const parsed = templateInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid template." };

  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("marketing_templates")
    .insert({
      name: parsed.data.name,
      channel: parsed.data.channel,
      subject: parsed.data.subject ?? null,
      preview_text: parsed.data.preview_text ?? null,
      body_html: parsed.data.body_html ?? null,
      body_text: parsed.data.body_text ?? null,
      title: parsed.data.title ?? null,
      message: parsed.data.message ?? null,
      image_url: parsed.data.image_url ?? null,
      deep_link: parsed.data.deep_link ?? null,
      media_url: parsed.data.media_url ?? null,
      buttons: (parsed.data.buttons ?? []) as Json,
      variables: (parsed.data.variables ?? []) as Json,
      status: parsed.data.status,
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  await audit("marketing_templates", data.id, "create");
  revalidateAll();
  return { ok: true, error: null, id: data.id };
}

export async function updateTemplate(id: string, input: Parameters<typeof templateInputSchema.parse>[0]): Promise<MarketingActionResult> {
  await guardManage();
  const parsed = templateInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid template." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("marketing_templates")
    .update({
      name: parsed.data.name,
      subject: parsed.data.subject ?? null,
      preview_text: parsed.data.preview_text ?? null,
      body_html: parsed.data.body_html ?? null,
      body_text: parsed.data.body_text ?? null,
      title: parsed.data.title ?? null,
      message: parsed.data.message ?? null,
      image_url: parsed.data.image_url ?? null,
      deep_link: parsed.data.deep_link ?? null,
      media_url: parsed.data.media_url ?? null,
      buttons: (parsed.data.buttons ?? []) as Json,
      variables: (parsed.data.variables ?? []) as Json,
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  await audit("marketing_templates", id, "update");
  revalidateAll();
  return { ok: true, error: null, id };
}

export async function duplicateTemplate(id: string): Promise<MarketingActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { data: src } = await supabase.from("marketing_templates").select("*").eq("id", id).single();
  if (!src) return { ok: false, error: "Template not found." };

  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("marketing_templates")
    .insert({
      name: `${src.name} (Copy)`,
      channel: src.channel,
      subject: src.subject,
      preview_text: src.preview_text,
      body_html: src.body_html,
      body_text: src.body_text,
      title: src.title,
      message: src.message,
      image_url: src.image_url,
      deep_link: src.deep_link,
      media_url: src.media_url,
      buttons: src.buttons,
      variables: src.variables,
      status: "active",
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  await audit("marketing_templates", data.id, "duplicate", { source_id: id });
  revalidateAll();
  return { ok: true, error: null, id: data.id };
}

export async function archiveTemplate(id: string): Promise<MarketingActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("marketing_templates").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("marketing_templates", id, "archive");
  revalidateAll();
  return { ok: true, error: null };
}

export async function deleteTemplate(id: string): Promise<MarketingActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("marketing_templates").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("marketing_templates", id, "delete");
  revalidateAll();
  return { ok: true, error: null };
}

// --------------------------- Automation ---------------------------

export async function updateAutomation(
  id: string,
  input: { is_enabled?: boolean; delay_minutes?: number; segment_id?: string | null; template_id?: string | null },
): Promise<MarketingActionResult> {
  await guardManage();
  const supabase = await createSupabaseServerClient();
  const patch: {
    updated_at: string;
    is_enabled?: boolean;
    delay_minutes?: number;
    segment_id?: string | null;
    template_id?: string | null;
  } = { updated_at: new Date().toISOString() };
  if (input.is_enabled !== undefined) patch.is_enabled = input.is_enabled;
  if (input.delay_minutes !== undefined) patch.delay_minutes = input.delay_minutes;
  if (input.segment_id !== undefined) patch.segment_id = input.segment_id;
  if (input.template_id !== undefined) patch.template_id = input.template_id;

  const { error } = await supabase.from("marketing_automation").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  const action = input.is_enabled !== undefined ? (input.is_enabled ? "enable" : "disable") : "update";
  await audit("marketing_automation", id, action);
  revalidateAll();
  return { ok: true, error: null, id };
}

export async function toggleAutomation(id: string, enabled: boolean): Promise<MarketingActionResult> {
  return updateAutomation(id, { is_enabled: enabled });
}

// --------------------------- Export ---------------------------

export async function exportMarketingReport(input: Parameters<typeof marketingExportSchema.parse>[0]): Promise<MarketingActionResult> {
  await guardView();
  const parsed = marketingExportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid export." };

  const { format, rows, columns, report_type } = parsed.data;
  const fileName = `${report_type}-${new Date().toISOString().slice(0, 10)}.${format}`;

  if (format === "json") {
    await audit("marketing_exports", crypto.randomUUID(), "export", { report_type, format });
    return { ok: true, error: null, content: JSON.stringify(rows, null, 2), fileName };
  }

  const cols = columns ?? Object.keys(rows[0] ?? {}).map((k) => ({ key: k, header: k }));
  const header = cols.map((c) => c.header).join(",");
  const body = rows.map((r) => cols.map((c) => JSON.stringify(r[c.key] ?? "")).join(",")).join("\n");
  await audit("marketing_exports", crypto.randomUUID(), "export", { report_type, format });
  return { ok: true, error: null, content: `${header}\n${body}`, fileName };
}
