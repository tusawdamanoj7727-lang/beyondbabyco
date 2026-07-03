import { z } from "zod";

import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
  TEMPLATE_CHANNELS,
  TEMPLATE_STATUSES,
  WORKFLOW_TYPES,
} from "./marketing-types";

export const campaignInputSchema = z.object({
  name: z.string().min(1, "Name is required.").max(200),
  campaign_type: z.enum(CAMPAIGN_TYPES),
  template_id: z.string().uuid().nullable().optional(),
  segment_id: z.string().uuid().nullable().optional(),
  subject: z.string().max(500).nullable().optional(),
  preview_text: z.string().max(500).nullable().optional(),
  sender_name: z.string().max(200).nullable().optional(),
  reply_to: z.string().email().nullable().optional().or(z.literal("").transform(() => null)),
  title: z.string().max(200).nullable().optional(),
  message: z.string().max(5000).nullable().optional(),
  image_url: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  deep_link: z.string().max(500).nullable().optional(),
  media_url: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  buttons: z.array(z.record(z.string(), z.unknown())).optional(),
  scheduled_at: z.string().nullable().optional(),
});

export const segmentInputSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens."),
  description: z.string().max(1000).nullable().optional(),
  segment_type: z.enum(["preset", "custom"]).default("custom"),
  criteria: z.record(z.string(), z.unknown()).default({}),
  is_active: z.boolean().default(true),
});

export const templateInputSchema = z.object({
  name: z.string().min(1).max(200),
  channel: z.enum(TEMPLATE_CHANNELS),
  subject: z.string().max(500).nullable().optional(),
  preview_text: z.string().max(500).nullable().optional(),
  body_html: z.string().nullable().optional(),
  body_text: z.string().nullable().optional(),
  title: z.string().max(200).nullable().optional(),
  message: z.string().max(5000).nullable().optional(),
  image_url: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  deep_link: z.string().max(500).nullable().optional(),
  media_url: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  buttons: z.array(z.record(z.string(), z.unknown())).optional(),
  variables: z.array(z.string()).optional(),
  status: z.enum(TEMPLATE_STATUSES).default("active"),
});

export const automationInputSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).nullable().optional(),
  workflow_type: z.enum(WORKFLOW_TYPES),
  trigger_event: z.string().min(1).max(200),
  delay_minutes: z.number().int().min(0).default(0),
  segment_id: z.string().uuid().nullable().optional(),
  action_type: z.enum(CAMPAIGN_TYPES),
  template_id: z.string().uuid().nullable().optional(),
  is_enabled: z.boolean().default(false),
});

export const scheduleCampaignSchema = z.object({
  scheduled_at: z.string().min(1, "Schedule date is required."),
});

export const sendTestSchema = z.object({
  campaign_id: z.string().uuid(),
  test_email: z.string().email().optional(),
  test_phone: z.string().optional(),
});

export const marketingExportSchema = z.object({
  format: z.enum(["csv", "json"]),
  report_type: z.string(),
  rows: z.array(z.record(z.string(), z.unknown())),
  columns: z.array(z.object({ key: z.string(), header: z.string() })).optional(),
});

export const campaignStatusSchema = z.object({
  status: z.enum(CAMPAIGN_STATUSES),
});
