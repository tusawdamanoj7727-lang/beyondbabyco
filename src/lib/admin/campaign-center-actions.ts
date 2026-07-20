"use server";

import { revalidatePath } from "next/cache";

import { parseCampaignConfig, serializeCampaignConfig, slugifyCampaignName } from "@/lib/campaigns/config";
import { validateCampaignForPublish } from "@/lib/campaigns/validation";
import type { CampaignCenterConfig } from "@/lib/campaigns/types";
import { runAiPresetAction } from "@/lib/ai/preset-actions";
import type { AiImagePresetId } from "@/lib/ai/preset-definitions";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { campaignInputSchema } from "./marketing-schema";
import type { MarketingActionResult } from "./marketing-actions";

function revalidateCampaignPaths() {
  const paths = [
    "/admin/marketing",
    "/admin/marketing/campaigns",
    "/admin/marketing/campaigns/calendar",
    "/admin/marketing/campaigns/creative",
    "/admin/banners",
    "/",
  ];
  for (const p of paths) revalidatePath(p);
}

async function auditCampaign(id: string, action: string, payload?: Json) {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("log_audit", {
    p_table: "marketing_campaigns",
    p_record: id,
    p_action: action,
    ...(payload === undefined ? {} : { p_new: payload }),
  });
}

export async function saveCampaignCenter(
  id: string | null,
  input: {
    name: string;
    campaign_type: "email" | "whatsapp" | "push" | "sms";
    config: CampaignCenterConfig;
    template_id?: string | null;
    segment_id?: string | null;
    subject?: string | null;
    message?: string | null;
    scheduled_at?: string | null;
    publish?: boolean;
  },
): Promise<MarketingActionResult> {
  await requirePermission(PERMISSIONS.MARKETING_MANAGE);

  const config = {
    ...input.config,
    slug: input.config.slug || slugifyCampaignName(input.name),
  };

  if (input.publish) {
    const v = validateCampaignForPublish(config, { status: "running" });
    if (!v.ok) return { ok: false, error: v.errors[0] ?? "Campaign validation failed." };
  }

  const payload = {
    name: input.name,
    campaign_type: input.campaign_type,
    template_id: input.template_id ?? null,
    segment_id: input.segment_id ?? null,
    subject: input.subject ?? config.headline ?? null,
    preview_text: config.subheading ?? null,
    title: config.headline ?? null,
    message: input.message ?? config.description ?? null,
    image_url: config.assets.hero ?? config.assets.banner ?? null,
    deep_link: config.targetUrl ?? null,
    media_url: config.assets.mobileBanner ?? null,
    scheduled_at: input.scheduled_at ?? config.startDate ?? null,
    buttons: serializeCampaignConfig(config) as Record<string, unknown>[],
  };

  const parsed = campaignInputSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid campaign." };

  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();

  if (id) {
    const { error } = await supabase
      .from("marketing_campaigns")
      .update({
        ...parsed.data,
        buttons: parsed.data.buttons as Json,
        ...(input.publish ? { status: "running" as const } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    await auditCampaign(id, input.publish ? "publish" : "update", { name: input.name, slot: config.homepageSlot });
    revalidateCampaignPaths();
    return { ok: true, error: null, id };
  }

  const { data, error } = await supabase
    .from("marketing_campaigns")
    .insert({
      ...parsed.data,
      buttons: parsed.data.buttons as Json,
      status: input.publish ? "running" : parsed.data.scheduled_at ? "scheduled" : "draft",
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  if (data?.id) {
    await auditCampaign(data.id, input.publish ? "publish" : parsed.data.scheduled_at ? "schedule" : "create", {
      name: input.name,
      slot: config.homepageSlot,
    });
  }
  revalidateCampaignPaths();
  return { ok: true, error: null, id: data.id };
}

export async function loadCampaignCenterConfig(id: string): Promise<CampaignCenterConfig | null> {
  await requirePermission(PERMISSIONS.MARKETING_VIEW);
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("marketing_campaigns").select("buttons").eq("id", id).single();
  if (!data) return null;
  return parseCampaignConfig(data.buttons);
}

export async function generateCampaignCreative(
  campaignId: string | null,
  formatId: string,
  presetId: AiImagePresetId,
  customPrompt?: string,
): Promise<MarketingActionResult & { url?: string }> {
  await requirePermission(PERMISSIONS.MARKETING_MANAGE);

  const result = await runAiPresetAction(presetId, customPrompt);
  if (!result.ok) return { ok: false, error: result.error };

  const url = result.result.publicPath;

  if (campaignId && !campaignId.startsWith("demo-")) {
    const supabase = await createSupabaseServerClient();
    const { data: row } = await supabase.from("marketing_campaigns").select("buttons").eq("id", campaignId).single();
    if (row) {
      const config = parseCampaignConfig(row.buttons);
      config.aiCreatives = [
        {
          id: crypto.randomUUID(),
          format: formatId,
          url,
          prompt: customPrompt,
          createdAt: new Date().toISOString(),
        },
        ...config.aiCreatives,
      ];
      await supabase
        .from("marketing_campaigns")
        .update({ buttons: serializeCampaignConfig(config, row.buttons) as Json, updated_at: new Date().toISOString() })
        .eq("id", campaignId);
    }
  }

  revalidateCampaignPaths();
  return { ok: true, error: null, url };
}
